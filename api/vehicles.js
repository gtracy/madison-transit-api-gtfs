'use strict';

const moment = require('moment-timezone');
const _ = require('underscore');

const fetch = require('./fetch');
const devkey = require('./devkey');
const utils = require('./utils');
const Routes = require('../lib/routes');
const Trips = require('../lib/trips');

// {
//     "status" : "0",
//     "count" : "3",
//     "routeID" : "07",
//     "timestamp" : "1/15/2012 10:13:44 AM",
//     "vehicles" : [
//       {
//         "lat": "43.0863712",
//         "lon": "-89.3601702",
//         "direction": "WTP",
//         "nextStop": "Jenifer & Ingersoll",
//         "vehicleID": "943",
//         "wifiAccess": false,
//         "bikeRack": false,
//         "wheelChairLift": false,
//         "wheelChairAccessible": false
//       },
//       {
//         "lat": "43.0535659",
//         "lon": "-89.4430852",
//         "direction": "WTP",
//         "nextStop": "West Transfer Point",
//         "vehicleID": "937"
//         "wifiAccess": false,
//         "bikeRack": false,
//         "wheelChairLift": false,
//         "wheelChairAccessible": false
//       },
// }
module.exports = async function(app) {

    app.get('/v1/getvehicles', utils.afterHours, devkey.validateDevKey, /*utils.logRequest,*/ async (req,res) => {
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
                            req.log.error({trip_id:v.vehicle.trip.trip_id},"failed to lookup trip details");
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
                        req.log.error(err,'vehicle trip lookup failed');
                        json_result.status = -1;
                    }
                }
            }
        }

        req.log.debug('/v1/getvehicles ' + json_result.routeID);
        res.json(json_result);
    });

}
