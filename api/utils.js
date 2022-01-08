'use strict';

const moment = require('moment-timezone');

// ignore any request between midnight and 5am
module.exports.afterHours = function(req,res,next) {

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

