/*
	----------------
	edgenode-monitor
	----------------
	author:	alexander collins
	notes:
		written in a rush, there's probably a better way of doing this
		see README.md for info
	updates:
		see git repo (local)
*/

//wrapper function for tidy lib/ requires
global.requireLib = function(module) {
	return require(__dirname + '/lib/' + module);
}
//function for fetching the current time
function timestamp() {
	return '['+new Date().toLocaleString()+']';
}

/*modules*/
const FS = require('fs');							//for reading settings.json
const DNS = require('dns');							//for testing connection status
const EXEC = require('child_process').exec;			//for restarting the server
const HBASE = require('hbase');						//interacting with hbase REST api
const NODEMAILER = require('nodemailer');			//mailer for sending alerts
const LOGPREFIX = require('log-prefix')(timestamp);	//add a timestamp prefix to console logs
const MS = require('ms');							//for parsing queryInterval in settings.json

/*globals*/
var settings;
var transport;
var	hbaseClient;

/*main*/
console.log('STARTING');
//send start email (let reciever know about reboots)
init();
//query, every interval period
setInterval(query, MS(settings.queryInterval));

/*functions*/
//initialise global variables
function init(callback) {
	console.log('init()...');
	//load settings file
	settings = JSON.parse(FS.readFileSync(__dirname + '/settings.json'));
	console.log('\tloaded ' + __dirname + '/settings.json');
	//initialise nodemailer transport
	transport = NODEMAILER.createTransport(settings.smtp);
	console.log('\tinitialised NODEMAILER transport');
	//initialise hbase client
	hbaseClient = HBASE({host: settings.hbase.host, port: settings.hbase.port});
	console.log('\tinialised HBASE client');
	//send out email notification of startup
	send_email('edgenode-monitor initialised, starting main loop.');
	
	//callback
	if (callback)
		callback();
}
//check status of services clients are connected to
function query() {
	console.log('query()...');
	
	//query hbase status
	hbaseClient.status_cluster(function(hbaseError, response) {	
		//handle hbase error
		if (hbaseError) {
			console.error('\thbase error:\n' + hbaseError);
			//check for an internet connection
			DNS.resolve('www.google.com', handleConnectionStatus);
			function handleConnectionStatus(dnsError) {
				if (dnsError)	//no connection = reboot
					EXEC('shutdown -r now');
				else			//connection = email alert
					send_email('Could not query hbase status. (Error: ' + JSON.stringify(hbaseError) + ')');
			}
		}
		//handle hbase response
		else {
			console.log('\thbase response:\n' + response);
			//reboot if all nodes are down
			if (response.LiveNodes.length == 0) {
				console.log('\tLiveNodes == 0, running "shutdown -r now".');
				EXEC('shutdown -r now');
			}
			//send alert email if some nodes are down
			else if (response.DeadNodes.length != 0) {
				console.log('\tDeadNodes != 0, sending alert');
				format_hbaseStatus(response, send_email);
			}
			else
				console.log('\tAll Nodes are fine, no action taken.');
		}
	});
}

//send email using nodemailer & transport
function send_email(content) {
	var email = {};

	console.log('\tsending out email:');
	console.log('\t\t' + settings.mail.subject);
	console.log('\t\t' + content);
	
	for (var i = 0; i < settings.mail.recievers.length; i++) {
		console.log('\t(email) ' + settings.mail.sender + ' -> ' + settings.mail.recievers[i]);
		
		//set email details
		email.from = settings.mail.sender;
		email.to = settings.mail.recievers[i];
		email.subject = settings.mail.subject;
		email.text = content;
		email.html = convert_stringToHTML(content);
		//send email
		transport.sendMail(email, handleResponse);

		function handleResponse(error, response) {
			transport.close();

			if (error) {
				console.log('\t(email) failed to send, see error log');
				console.error('\t' + error);
				//test connection & reboot if need to
			}
			else
				console.log('\t(email) successfully sent ('+response.envelope.to+')');
		};
	}
};

//format hbase status string from response json
function format_hbaseStatus(response, callback) {
	var string = '';

	console.log('\tformatting hbase response status');
	
	string = string.concat('uptime: ' + get_uptime() + '\n');
	string = string.concat('\n');
	string = string.concat('HBase Status\n');
	string = string.concat('**********\n');
	string = string.concat('regions: ' + response.regions + '\n');
	string = string.concat('averageLoad: ' + response.averageLoad + '\n');
	string = string.concat('requests: ' + response.requests + '\n');
	string = string.concat('\n');
	string = string.concat('LiveNodes: ' + response.LiveNodes.length + '\n');
	for (var i = 0; i < response.LiveNodes.length; i++)
		string = string.concat('\t' + response.LiveNodes[i].name + '\n');
	string = string.concat('DeadNodes: ' + response.DeadNodes.length + '\n');
	for (var i = 0; i < response.DeadNodes.length; i++)
		string = string.concat('\t' + response.DeadNodes[i].name + '\n');
	string = string.concat('\n');
	
	if (callback)
		callback(string);
}

//convert string special characters to HTML (for email)
function convert_stringToHTML(string) {
	var html = '';
	var stringArray = [];
	
	//replace newlines with <br/>
	stringArray = string.split('\n');
	for (var i = 0; i < stringArray.length; i++)
		html = html.concat(stringArray[i] + '<br/>');
	
	html = '';
	stringArray = [];
	
	//replace tabs with 4 spaces
	stringArray = html.split('\t');
	for (var i = 0; i < stringArray.lenggth; i++)
		html = html.concat(stringArray[i] + '    ');
	
	return html;
}

//gets the uptime from /proc/uptime & converts it to timestamp from seconds
function get_uptime(callback) {
	var uptime;
	var days, hours, minutes, seconds;
	
	//get uptime
	uptime = parseFloat(FS.readFileSync('/proc/uptime', 'utf-8').split(' ')[0]);
	//convert uptime (seconds) to timestamp
	days = Math.floor(uptime / 86400);
	hours = Math.floor(uptime % 86400 / 3600);
	minutes = Math.floor(uptime % 86400 % 3600 / 60);
	seconds = Math.floor(uptime % 86400 % 3600 % 60);
	
	return (days + ' days '+hours+' hours '+minutes+' minutes '+seconds+' seconds');
}

