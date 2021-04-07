var _ = require('underscore')
var GtfsRealtimeBindings = require('gtfs-realtime-bindings')
var request = require('request')
var routes = require('./routes')


var stop_id, route_id;
if( process.argv.length === 3 ) {
  stop_id = process.argv[2];
  fetch_stop(stop_id);
} else {
  stop_id = process.argv[2];
  route_id = process.argv[3];
  fetch_stop_route(stop_id,route_id);
}

function fetch_stop(stop_id) {
  var stops = []

  var requestSettings = {
    method: 'GET',
    url: 'http://transitdata.cityofmadison.com/TripUpdate/TripUpdates.pb',
    encoding: null
  };
  request(requestSettings, (error, response, body) => {
    if (!error && response.statusCode == 200) {
      var feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(body);
      feed.entity.forEach(function(entity) {
        console.dir(entity)
        if (entity.tripUpdate) {
            entity.tripUpdate.stopTimeUpdate.forEach(function(stop) {
                console.dir(stop);
                
                if( stop.stopId === stop_id ) {
                  stops.push({ 
                    stop : stop,
                    route_id : entity.tripUpdate.trip.routeId
                  });
                }
                
            })
        }
      })
      _.sortBy(stops,'stop.departure.time');
      stops.forEach(function(s) {
        console.log(s.stop.stopId,new Date(s.stop.departure.time.low))
      });
    }
  })
}

function fetch_stop_route(stop_id,route_id) {
  var route = _.where(routes,{route_short_name : parseInt(route_id)})
  var route_code = route[0].route_id
  console.log(stop_id,route_id,route_code)
  console.log()

  var requestSettings = {
    method: 'GET',
    url: 'http://transitdata.cityofmadison.com/TripUpdate/TripUpdates.pb',
    encoding: null
  };
  request(requestSettings, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var feed = GtfsRealtimeBindings.FeedMessage.decode(body);
      feed.entity.forEach(function(entity) {
        if (entity.trip_update && parseInt(entity.trip_update.trip.route_id) === route_code) {
          console.log("route hit")
            entity.trip_update.stop_time_update.forEach(function(stop) {
                
                if( stop.stop_id === stop_id ) {
                  console.log(stop)
                  var results = {
                    stop : {
                      stopID : stop_id,
                      routes : [
                        {
                          routeID : stop.route_short_name,
                          destination : stop.route_service_name,
                          time : 1
                        }
                      ]
                    }
                  }
                }
            })
        }
      })
    }
  })
}
