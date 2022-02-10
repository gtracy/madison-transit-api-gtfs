'use strict';

const moment = require('moment-timezone');
const _ = require('underscore');

const fetch = require('./fetch');
const devkey = require('./devkey');
const utils = require('./utils');
const Routes = require('../lib/routes');
const Trips = require('../lib/trips');

const config = require('../config');
const logger = require('pino')(config.getLogConfig());


module.exports = async function(app) {

    app.get('/v1/getvehicles', utils.afterHours, devkey.validateDevKey, async (req,res) => {
        var json_result = {};
        var gtfs_trips = new Trips();

        // snag the API query details
        const route_id = req.query.routeID;
        const gtfs_route_id = Routes.fetchBy_human_id(route_id).route_id;

        // inspect results and build the payload
        json_result.status = "0";
        json_result.count = 0;
        json_result.routeID = route_id;
        json_result.timestamp = moment().tz("America/Chicago").format("h:mmA");
        json_result.vehicles = [];

        // go grab the real-time Metro data
        const vehicles = await fetch.fetch_vehicles(route_id);

        if( !vehicles || vehicles.length === 0 ) {
            json_result.count = 0;
        } else {
            // roll through the trips looking for the requested route
            for( let i=0; i<vehicles.length; i++ ) {
                const v = vehicles[i];

                if( v.vehicle.trip.route_id === gtfs_route_id ) {
                    // hit
                    json_result.count++;

                    // get the vehicle direction from the trip details
                    try {
                        const trip_details = await gtfs_trips.fetchById(v.vehicle.trip.trip_id);
                        let trip_direction = 'unknown';
                        if( !trip_details ) {
                            logger.error({trip_id:v.vehicle.trip.trip_id},"failed to lookup trip details");
                        } else {
                            trip_direction = trip_details.trip_headsign;

                            json_result.vehicles.push({
                                lat: v.vehicle.position.latitude,
                                lon: v.vehicle.position.longitude,
                                direction: trip_direction,
                                nextStop: 'unknown',
                                vehicleID: v.vehicle.vehicle.label,
                                wifiAccess: 'unknown',
                                bikeRack: trip_details.bikes_allowed==="1",
                                wheelChairLift: 'unknown',
                                wheelChairAccessible: trip_details.wheelchair_accessible==="1"
                            });
                        }
                    } catch(err) {
                        logger.error(err,'vehicle trip lookup failed');
                        json_result.status = -1;
                    }
                }
            }
        }

        logger.debug(json_result, '/v1/getvehicles');
        res.json(json_result);
    });

}
