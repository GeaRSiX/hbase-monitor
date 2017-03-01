# edgenode-monitor

## Description
This is a simple node script that queries a hbase REST server and either sends out an email alerting the recipient of it's response or reboots if no nodes are active or if it's unable to resolve google.com

## Installation
1. Install [Node.JS](https://nodejs.org/) & [MongoDB](https://www.mongodb.org/)
2. Clone this repository
```bash
	git clone <this repo>
	cd edgenode-monitor
```
3. Install Node dependencies
```bash
	npm install
```
4. Change the settings to fit your requirements
5. Run it as a service

## Author
* Alexander Collins <alexander.j.collins@intel.com>

## Changelog
See git log (I tried to keep it tidy)
