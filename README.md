# edgenode-monitor

## Contents
1. [Overview](##Overview)
2. [Install](##Install)
3. [Notes (important)](##Notes)
4. [Authors](##Authors)
5. [Changelog](##Changelog)

## Overview
This is a simple node script that queries a hbase REST server and either sends out an email alerting the recipient of it's response (using nodemailer) or reboots if no nodes are active or if it's unable to resolve google.com

## Install
1. Install [Node.JS](https://nodejs.org/)
2. Install Node dependencies
```
	npm install
```
4. Change the settings.json to fit your requirements
	* The settings in this file are blank by default
5. Run it as a service on your cluster

**Read [Notes](##Notes)**

## Notes
This was designed for a specific usecase and hasn't been tested on any other systems.
Consequently, it might not work on other systems. I don't see why not though, provided the settings.json is set right.
Honestly, I'm mostly hosting this here for archiving. Someone might find it useful though.

## Author
* Alexander Collins <alexander.j.collins@intel.com>

## Changelog
See git log (I tried to keep it tidy)
