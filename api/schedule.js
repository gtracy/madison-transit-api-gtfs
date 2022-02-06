'use strict';

const moment = require('moment-timezone');
const _ = require('underscore');

const config = require('../config');
const fetch = require('./fetch');
const devkey = require('./devkey');
const utils = require('./utils');
const Routes = require('../lib/routes');
const Trips = require('../lib/trips');
const logger = require('pino')(config.getLogConfig());


module.exports = async function(app) {

    app.get('/v1/getarrivals', utils.afterHours, devkey.validateDevKey, utils.logRequest, async (req,res) => {
        let json_result = {};
        let gtfs_trips = new Trips();
        let route = undefined;

        // snag the API query details
        const stop_id = req.query.stopID;
        const route_id = req.query.routeID;

        // inspect results and build the payload
        json_result.status = "0";
        json_result.timestamp = moment().tz("America/Chicago").format("h:mmA");
        json_result.stop = {'stopID' : stop_id,'route':[]};
        json_result.cached = false;

        // go grab the real-time Metro data
        const trips = await fetch.fetch_trips(stop_id,route_id);

        if( trips && trips.length > 0 ) {

            // fetch a list of GTFS trip details found in dynamo. 
            // this is batch read with all tripIds
            let trip_id_list = _.map(trips, (trip) => {
                return trip.tripId;
            });
            // remove duplicates caused by multiple buses on the same trip
            let unique_trip_id_list = trip_id_list.filter((value,index,self) => {
                return self.indexOf(value) === index;
            });
            const trip_details = await gtfs_trips.batchFetchById(unique_trip_id_list);
            
            // bail if there were no results
            if( trip_details.length > 0 ) {
                // join the trip details (dyanmo) with the real-time GTFS trip data
                // then package up the json payload
                for( let i=0; i < trips.length; i++ ) {
                    let trip = trips[i];

                    // matchup the trip_id we are looping on with the GTFS details
                    let details = _.find(trip_details, (details) => {
                        return details.trip_id == trip.tripId;
                    });
                    let destination = 'unknown';
                    let bikes_allowed = 'unknown';
                    if( details ) {
                        destination = details.trip_headsign;
                        bikes_allowed = details.bikes_allowed;
                    }

                    route = Routes.fetchBy_gtfs_id(trip.routeId);
                    let route_short_name = 'unknown';
                    if( route ) {
                        route_short_name = route.route_short_name;
                    }

                    // dates and timezones suck
                    // note that the epoch times in the GTFS data are in seconds
                    const arrival_time = gtfs_trips.computeArrivalTime(trip);
                    const minutes = gtfs_trips.computeTimeDelta(trip);

                    // pack the trip details into the request payload
                    if( minutes >= 0 ) {
                        json_result.stop.route.push({
                            'routeID' : route_short_name,
                            'destination' : destination,
                            'minutes' : minutes,
                            'arrivalTime' : arrival_time,
                            'vehicleID' : utils.getValue(trip.vehicle,"label",true),
                            'bikesAllowed' : bikes_allowed
                        });
                    }

                }
            } else {
                json_result.status = "-1";
                json_result.message = "invalid stopID";    
            }
        }

        logger.debug(json_result,'/v1/getarrivals ');
        res.json(json_result);
    });

}
