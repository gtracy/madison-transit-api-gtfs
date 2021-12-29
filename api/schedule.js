'use strict';

const moment = require('moment-timezone');
const _ = require('underscore');

const fetch = require('./fetch');
const Routes = require('../routes');
const GTFSTrips = require('../trips');

module.exports = async function(app) {

    app.get('/v1/getarrivals', async (req,res) => {
        var json_result = {};
        var gtfs_trips = new GTFSTrips();

        // snag the API query details
        const dev_key = req.query.devKey;
        const stop_id = req.query.stopID;
        const route_id = req.query.routeID;

        // go grab the real-time Metro data
        const trips = await fetch.fetch_stop(stop_id,route_id);

        // inspect results and build the payload
        json_result.status = "0";
        json_result.timestamp = moment().tz("America/Chicago").format("h:mA");
        json_result.stop = {'stopID' : stop_id,'route':[]};
        json_result.cached = false;

        // fetch a list of destinations for the trips
        let trip_id_list = _.map(trips, (trip) => {
            return trip.tripId;
        });
        const trip_details = await gtfs_trips.fetchById(trip_id_list);

        //await trips.forEach(async (trip) => { 
        for( let i=0; i < trips.length; i++ ) {
            let trip = trips[i];
            
            // dates and timezones suck
            // note that the epoch times in the GTFS data are in seconds
            const arrival_time = moment.tz(new Date(trip.stop.departure.time.low * 1000),'America/Chicago').format("h:mA");
            const minutes = Math.round((trip.stop.departure.time.low - trip.feed_time.low) / 60);

                json_result.stop.route.push({
                    'routeID' : Routes.fetchBy_gtfs_id(trip.routeId).route_short_name,
                    'destination' : trip_details[i].trip_headsign,
                    'minutes' : minutes,
                    'arrivalTime' : arrival_time,
                    'vehicleID' : trip.vehicle.label,
                    'bikesAllowed' : trip_details[i].bikes_allowed
                });
        };

        json_result.status = 0;
        console.log('/v1/getarrivals ' + json_result.stop.stopID);
        res.json(json_result);
    });

}
