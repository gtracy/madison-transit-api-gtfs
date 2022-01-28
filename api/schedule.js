'use strict';

const moment = require('moment-timezone');
const _ = require('underscore');

const fetch = require('./fetch');
const devkey = require('./devkey');
const utils = require('./utils');
const Routes = require('../lib/routes');
const Trips = require('../lib/trips');


module.exports = async function(app) {

    app.get('/v1/getarrivals', utils.afterHours, devkey.validateDevKey, utils.logRequest, async (req,res) => {
        var json_result = {};
        var gtfs_trips = new Trips();

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

                    // matchup the trip_id we are looping on with the details we found earlier
                    let details = _.find(trip_details, (details) => {
                        return details.trip_id == trip.tripId;
                    });
                    let destination = 'unknown';
                    if( details ) {
                        destination = details.trip_headsign;
                    } else {
                        req.log.error({trips:unique_trip_id_list},'mismatched trip IDs');
                    }

                    // dates and timezones suck
                    // note that the epoch times in the GTFS data are in seconds
                    const arrival_time = gtfs_trips.computeArrivalTime(trip);
                    const minutes = gtfs_trips.computeTimeDelta(trip);

                    const route = Routes.fetchBy_gtfs_id(trip.routeId);
                    if( !route ) {
                        req.log.error(trip,'missing route details for '+trip.routeId);
                    } else {
                        if( minutes >= 0 ) {
                            json_result.stop.route.push({
                                'routeID' : route.route_short_name,
                                'destination' : destination,
                                'minutes' : minutes,
                                'arrivalTime' : arrival_time,
                                'vehicleID' : trip.vehicle.label,
                                'bikesAllowed' : details.bikes_allowed
                            });
                        }
                    }
                }
            } else {
                json_result.status = "-1";
                json_result.message = "invalid stopID";    
            }
        }

        req.log.debug('/v1/getarrivals ' + json_result.stop.stopID);
        res.json(json_result);
    });

}
