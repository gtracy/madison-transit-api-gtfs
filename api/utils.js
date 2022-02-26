'use strict';

const moment = require('moment-timezone');
const config = require('../config');
const logger = require('pino')(config.getLogConfig());
const queue = require('../aws/queue');

// ignore requests with missing query parameters
module.exports.validateRequest = (req,res,next) => {

    if( !req.query.key ) {
        res.json({
            status: "-1",
            description: "missing developer key in request (?key=)"
        });
    } else if( !req.query.stopID ) {
        res.json({
            status: "-1",
            description: "missing stopID in request (?stopID=)"
        });
    } else {
        next();
    }

}

// ignore any request between midnight and 5am
module.exports.afterHours = (req,res,next) => {

    let now = moment().tz("America/Chicago");
    if( now.hour() >= 1 && now.hour() < 5 ) {
        // return empty results
        res.json({
            status: "0",
            timestamp: moment().tz("America/Chicago").format("h:mmA"),
            stop: {'stopID' : req.query.stopID,'route':[]},
            cached: false
        });
    } else {
        next();
    }

}

// log all API requests
module.exports.logRequest = async (req,res,next) => {
    if( config.requestLogEnabled() ) {
        await queue.push(req.path, req.originalUrl, req.query.key, req.query.stopID);
        next();
    } else {
        next();
    }
}

// wrapper to avoid missing properties in the GTFS feeds
//   obj - parent object
//   property - value to return
//   string - boolean indicating whether we want to return a string value
//
module.exports.getValue = (obj,property,string) => {
    if( !obj ) {
        // logging an error since we really never want these to happen.
        // lets figure out why they are happening.
        logger.error({obj:obj,property:property},'missing feed property');
        if( string ) {
            return 'unknown';
        } else {
            return undefined;
        }
    } else {
        return obj[property];
    }
}