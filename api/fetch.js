'use strict';

const _ = require('underscore');
const moment = require('moment-timezone');
const got = require('got');
const {performance} = require('perf_hooks');
const GtfsRealtimeBindings = require('gtfs-realtime-bindings');
const routes = require('../routes');

const METRO_GTFS_ENDPOINT = 'http://transitdata.cityofmadison.com/TripUpdate/TripUpdates.pb';

//
// returns a list of trip details, where every trip describes the
// details of every bus passing through the specified stop_id
// 
// route_id is not required. when used, the trip details are
// filtered to only include the respective route.
//
module.exports.fetch_stop = async function(stop_id, route_id) {
    var trips = [];
    var route = {};

    // map the user friendly route_id to a GTFS routeId
    if( route_id ) {
        route = routes.fetchBy_human_id(route_id);
    }

    try {
        var startTime = performance.now();
        const response = await got(METRO_GTFS_ENDPOINT,{responseType:'buffer'});
        var feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(response.body);
        var endTime = performance.now();
        console.log(`Fetch+parse took ${endTime - startTime} milliseconds`);

        // parse the real-time results and do some transformations 
        // so the data is easier to consume
        trips.timestamp = feed.header.timestamp;
        feed.entity.forEach((entity) => {
            if (entity.tripUpdate) {
                if( !route_id || route.route_id == entity.tripUpdate.trip.routeId ) {
                    entity.tripUpdate.stopTimeUpdate.forEach((stop) => {    
                        if( stop.stopId === stop_id ) {
                            trips.push({
                                'feed_time' : feed.header.timestamp,
                                'stop'    : stop,
                                'routeId' : entity.tripUpdate.trip.routeId,
                                'tripId'  : entity.tripUpdate.trip.tripId,
                                'vehicle' : {
                                    'id'    : entity.tripUpdate.vehicle.id,
                                    'label' : entity.tripUpdate.vehicle.label
                                }
                            });
                        }
                    });
                }
            }
        });
        // proactively sort the trips by departure times
        var sorted_trips = _.sortBy(trips, (t) => {
            return t.stop.departure.time.low;
        });
        return sorted_trips;
  
    } catch (error) {
        console.log(error.message);
        return [];
    }

}
