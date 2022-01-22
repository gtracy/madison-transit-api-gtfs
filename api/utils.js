'use strict';

const moment = require('moment-timezone');
const queue = require('../aws/queue');

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
    await queue.push(req.path, req.originalUrl, req.query.key, req.query.stopID);
    next();
}