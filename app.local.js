'use strict';

const fetch = require('./api/fetch');

// command line take one or two arguments
//   get by stop id
//   get by stop id + route id
//
var stop_id, route_id;
if( process.argv.length === 3 ) {
  stop_id = process.argv[2];
  fetch.fetch_stop(stop_id);
} else {
  stop_id = process.argv[2];
  route_id = process.argv[3];
  fetch.fetch_stop(stop_id,route_id);
}
