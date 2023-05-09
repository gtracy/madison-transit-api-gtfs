'use strict';

const moment = require('moment-timezone');
const devkey = require('./devkey');
const utils = require('./utils');
const Stops = require('../lib/stops');

const config = require('../config');
const logger = require('pino')(config.getLogConfig());


module.exports = async function(app) {

    // {
    //     "status" : "0",
    //     "timestamp" : "12:38pm",
    //     "stopID" : "1391",
    //     "intersection" : "Atwood & Ohio",
    //     "latitude" : "43.0937715",
    //     "longitude" : "-89.3467281",
    // }
    app.get('/v1/getstoplocation', utils.validateRequest, utils.afterHours, devkey.validateDevKey, async (req,res) => {
        var json_result = {};
        var gtfs_stop = new Stops();

        // snag the API query details
        const stop_id = req.query.stopID;

        json_result.status = "0";
        json_result.timestamp = moment().tz("America/Chicago").format("h:mmA");
        json_result.stopID = stop_id;

        // go grab the stop data
        const stop_data = await gtfs_stop.fetchById(stop_id);
        if( stop_data ) {
            // inspect results and build the payload
            json_result.intersection = stop_data.stop_name;
            json_result.latitude = parseFloat(stop_data.stop_lat);
            json_result.longitude = parseFloat(stop_data.stop_lon);
        } else {
            json_result.status = "-1";
            json_result.message = "invalid stopID";
        }
        logger.debug(json_result,'/v1/getstoplocation ');
        res.json(json_result);
    });

    app.get('/v1/getstops',  (req,res) => {
        res.json({
            status : 0,
            description : "this endpoint has been deprecated"
        });
    });

    app.get('/v1/getnearbystops',  (req,res) => {
        res.json({
            status : 0,
            description : "this endpoint has been deprecated"
        });
    });


}
