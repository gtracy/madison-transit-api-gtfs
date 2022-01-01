'use strict';

const _ = require('underscore');
const moment = require('moment-timezone');
const got = require('got');
const {performance} = require('perf_hooks');
const GtfsRealtimeBindings = require('gtfs-realtime-bindings');
const routes = require('../lib/routes');

const METRO_GTFS_ENDPOINT = 'http://transitdata.cityofmadison.com/TripUpdate/TripUpdates.pb';

//
// returns a list of trip details, where every trip describes the
// details of every bus passing through the specified stop_id
// 
// route_id is not required. when used, the trip details are
// filtered to only include the respective route.
//
module.exports.fetch_trips = async (stop_id, route_id) => {
    let trips = [];
    let route = {};

    // map the user friendly route_id to a GTFS routeId
    if( route_id ) {
        route = routes.fetchBy_human_id(route_id);
    }

    try {
        let startTime = performance.now();
        const response = await got(METRO_GTFS_ENDPOINT,{responseType:'buffer'});
        let feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(response.body);
        let endTime = performance.now();
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
        // proactively sort the trips by departure times, and
        // perform some subtle tranformations to make the object
        // more usable. 
        var sorted_trips = _.sortBy(trips, (t) => {
            if( t.stop.departure ) {
                return t.stop.departure.time.low;
            } else if( t.stop.arrival ) {
                return t.stop.arrival.time.low;
            } else {
                console.log('total fail consuming this StopTimeUpdate');
                console.dir(t);
                return 9999;
            }
        });
        return sorted_trips;
  
    } catch (error) {
        console.log(error.message);
        return [];
    }

}

