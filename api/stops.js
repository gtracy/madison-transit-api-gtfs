'use strict';

const moment = require('moment-timezone');
const fs = require('fs');
const devkey = require('./devkey');
const utils = require('./utils');
const gtfs_stop = require('../lib/stops');

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
    app.get('/v1/getstoplocation', utils.validateRequest, devkey.validateDevKey, async (req,res) => {
        var json_result = {};

        function padStringWithZeros(str) {
            const paddedStr = str.padStart(4, '0');
            return paddedStr;
        }

        // snag the API query details
        // the legacy API contract uses "stop ID" terminology, but
        // the internal workings of GTFS and the data layer use
        // "stop code". make that translation here to avoid confusion
        // ... also make sure the ID is always a four-digit string
        const stop_code = padStringWithZeros(req.query.stopID);

        json_result.status = "0";
        json_result.timestamp = moment().tz("America/Chicago").format("h:mmA");
        json_result.stopID = stop_code;

        // go grab the stop data
        const stop_data = await gtfs_stop.fetchByCode(stop_code);
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

    app.get('/v1/getstops', devkey.validateDevKey, async (req,res) => {
        var json_result = {};

        json_result.status = "0";
        json_result.timestamp = moment().tz("America/Chicago").format("h:mmA");

        // the stop data is static so we grab from a json file
        // to simplify the implementation
        const data = fs.readFileSync('./lib/stops.json', 'utf8');
        const stop_json = JSON.parse(data);
        json_result.stops = stop_json;

        logger.debug(json_result,'/v1/getstops ');
        res.json(json_result);
    });


    app.get('/v1/getnearbystops',  (req,res) => {
        res.json({
            status : 0,
            description : "this endpoint has been deprecated"
        });
    });

}
