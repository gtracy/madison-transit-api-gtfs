'use strict';

const _ = require('underscore');
const fs = require("fs");
const csvToJson = require('convert-csv-to-json');

function _Routes() {

    // utility function that transforms and shrink a GTFS Routes 
    // file into a JSON object this class will query for route details
    this.transformGTFSFile = (gtfs_input_file,json_output_file) => {
        //
        let json = csvToJson.fieldDelimiter(',').getJsonFromCsv(gtfs_input_file);
        console.log('total routes : '+json.length);
        console.log('sample route transformed : ');
        console.dir(json[0]);
        let json_small = _.map(json, (obj) => {
            return ({
                'route_id' : obj.route_id,
                'route_short_name' : obj.route_short_name,
                'route_service_name' : obj.route_service_name,
                'bikes_allowed' : obj.bikes_allowed
            });
        });
        console.dir(json_small[0]);
        fs.writeFile(json_output_file, JSON.stringify(json_small), (error) => {
            if (error) throw error;
        });
    }

}

//
// fetch a route object by searching for
// a GTFS route ID
//
_Routes.prototype.fetchBy_gtfs_id = (route_id) => {
    const gtfs_routes = require('../lib/routes.json');

    const route = _.find(gtfs_routes, (route) => {
        return route.route_id == route_id;
    });
    return route;
}

// 
// fetch a route object by searching for 
// a human readable route ID
//
_Routes.prototype.fetchBy_human_id = (route_id) => {
    const gtfs_routes = require('../lib/routes.json');

    var route_id_string = '';
    // the route ID are strings with a minimum of two characters
    if( route_id < 10 ) {
      route_id_string += '0' + route_id;
    } else {
        route_id_string += route_id;
    }
    const route = _.find(gtfs_routes, (route) => {
        return route.route_short_name == route_id_string;
    });
    return route;
}

// 
// utility to parse a route service name to 
// extract the destination
//
_Routes.prototype.getDestination = (service_name) => {
    const service = service_name.split(':');
    if( service.length > 0 ) {
        return service[1];
    } else {
        return 'unknown';
    }
}

// instantiate the singleton
var routes = new _Routes();
module.exports = routes;
