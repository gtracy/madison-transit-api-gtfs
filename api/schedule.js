'use strict';

const moment = require('moment-timezone');
const _ = require('underscore');

const fetch = require('./fetch');
const devkey = require('./devkey');
const Routes = require('../lib/routes');
const Trips = require('../lib/trips');


module.exports = async function(app) {

    app.get('/v1/getarrivals', devkey.validateDevKey, async (req,res) => {
        var json_result = {};
        var gtfs_trips = new Trips();

        // snag the API query details
        const stop_id = req.query.stopID;
        const route_id = req.query.routeID;

        // go grab the real-time Metro data
        const trips = await fetch.fetch_trips(stop_id,route_id);

        // inspect results and build the payload
        json_result.status = "0";
        json_result.timestamp = moment().tz("America/Chicago").format("h:mmA");
        json_result.stop = {'stopID' : stop_id,'route':[]};
        json_result.cached = false;

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
            const trip_details = await gtfs_trips.fetchById(unique_trip_id_list);

            // join the trip details (dyanmo) with the real-time GTFS trip data
            // then package up the json payload
            for( let i=0; i < trips.length; i++ ) {
                let trip = trips[i];

                // matchup the trip_id we are looping on with the details we found earlier
                let details = _.find(trip_details, (details) => {
                    return details.trip_id == trip.tripId;
                });
                let destination = details.trip_headsign;

                // dates and timezones suck
                // note that the epoch times in the GTFS data are in seconds
                const arrival_time = gtfs_trips.computeArrivalTime(trip);
                const minutes = gtfs_trips.computeTimeDelta(trip);

                    json_result.stop.route.push({
                        'routeID' : Routes.fetchBy_gtfs_id(trip.routeId).route_short_name,
                        'destination' : destination,
                        'minutes' : minutes,
                        'arrivalTime' : arrival_time,
                        'vehicleID' : trip.vehicle.label,
                        'bikesAllowed' : details.bikes_allowed
                    });
            };
        }

        json_result.status = 0;
        console.log('/v1/getarrivals ' + json_result.stop.stopID);
        res.json(json_result);
    });

}
