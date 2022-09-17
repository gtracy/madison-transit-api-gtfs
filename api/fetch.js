'use strict';

const _ = require('underscore');
const got = require('got');
const {performance} = require('perf_hooks');
const GtfsRealtimeBindings = require('gtfs-realtime-bindings');

const config = require('../config');
const logger = require('pino')(config.getLogConfig());
const routes = require('../lib/routes');
const utils = require('./utils');

const METRO_TRIP_ENDPOINT = 'http://transitdata.cityofmadison.com/TripUpdate/TripUpdates.pb';
const METRO_VEHICLE_ENDPOINT = 'http://transitdata.cityofmadison.com/Vehicle/VehiclePositions.json';

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
        // if the request is asking for a route and 
        // that route does not exist just bail out.
        logger.debug('unable to find requested route '+route_id);
        return [];
    }

    try {
        let startTime = performance.now();
        const response = await got(METRO_TRIP_ENDPOINT,{responseType:'buffer'});
        let feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(response.body);
        let endTime = performance.now();
        logger.info({fetch_time:(endTime-startTime)},`Fetch+parse took ${endTime - startTime} milliseconds`);

        // parse the real-time results and do some transformations 
        // so the data is easier to consume
        trips.timestamp = feed.header.timestamp;
        feed.entity.forEach((entity) => {
            if (entity.tripUpdate) {
                if( !route_id || route.route_id == entity.tripUpdate.trip.routeId ) {
                    entity.tripUpdate.stopTimeUpdate.forEach((stop) => {  
                        if( stop.stopId === parseInt(stop_id).toString() ) { // shaves leading zeros
                            trips.push({
                                'feed_time' : feed.header.timestamp,
                                'stop'    : stop,
                                'routeId' : entity.tripUpdate.trip.routeId,
                                'tripId'  : entity.tripUpdate.trip.tripId,
                                'vehicle' : {
                                    'id'    : utils.getValue(entity.tripUpdate.vehicle,"id",true),
                                    'label' : utils.getValue(entity.tripUpdate.vehicle,"label",true)
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
                logger.error(t,'total fail consuming this StopTimeUpdate. Unable to parse the stop time',t.stop);
                return 9999;
            }
        });
        return sorted_trips;
  
    } catch (error) {
        logger.error(error);
        return [];
    }

}

// 
// returns a list of vehicles that are active in the system.
//
// we fetch directly from the live vehicle endpoint
//
module.exports.fetch_vehicles = async () => {
    let vehicles = [];

    const response = await got(METRO_VEHICLE_ENDPOINT,{responseType:'json'});
    if( response.body && response.body.entity ) {
        return response.body.entity;
    } else {
        logger.error(response,'failed to fetch live vehicle data');
        return [];
    }

}
