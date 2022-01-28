'use strict';

const _ = require('underscore');
const moment = require('moment-timezone');
const config = require('../config');
const logger = require('pino')(config.getLogConfig());

let AWS = require('aws-sdk');

//
// overloaded object that encapsulates TripUpdate details from the real-time
// GTFS feed as well as an interface to our local datastore for fixed 
// trip data. 
//
function Trips() {
    const TABLE_NAME = 'Trips_gtfs';

    // Create an Amazon DynamoDB service client object.
    AWS.config.update(config.getAWSConfig());
    let ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

    this.getTableName = () => {
        return TABLE_NAME;
    }

    // fetch Trip details by tripId
    //    trip_ids is an array of GTFS trip id strings
    //
    this.batchFetchById = async (trip_ids) => {
        let descriptions = [];

        if( !ddb ) {
            return "mocked trip description";
        } else {
            let params = {RequestItems: {[TABLE_NAME] : {Keys: []}}};

            trip_ids.forEach((trip_id,index) => {
                params.RequestItems[TABLE_NAME].Keys.push({'trip_id': {S:trip_id}});
                descriptions[index] = 'unknown';
            });

            try {
                let aws_result = await ddb.batchGetItem(params).promise();

                // flatten the results because AWS SDK is bonkers
                let trip_results = _.map(aws_result.Responses[TABLE_NAME],(result) => {
                    return {
                        'route_id' : result.route_id.S,
                        'trip_id' : result.trip_id.S,
                        'trip_headsign' : result.trip_headsign.S,
                        'direction_name' : result.direction_name.S,
                        'bikes_allowed' : result.bikes_allowed.S,
                    }
                })
                logger.debug("Successfully fetched " + trip_results.length + " results from " + TABLE_NAME);
                return trip_results;
            } catch( error ) {
                logger.error(error,"Trips/batchGetItem fail");
                return [];
            }
            

        }
    }

    // fetch a Trip_gtfs record with a trip_id key
    //
    this.fetchById = async (trip_id) => {
        const docClient = new AWS.DynamoDB.DocumentClient();
        const params = {
            TableName: TABLE_NAME,
            Key: {
                trip_id: trip_id
            }
        };
        
        try {
            let result = await docClient.get(params).promise();
            return result.Item;
        } catch(err) {
            logger.error(err,"Trips/fetchById failed to query dynamo");
            return undefined;
        }
    }

    // 
    // convenience for extracting a string that represents trip times
    //
    this.computeArrivalTime = (trip) => {
        // dates and timezones suck
        // note that the epoch times in the GTFS data are in seconds
        let arrival_time;
        if( trip.stop.departure ) {
            return moment.tz(new Date(trip.stop.departure.time.low * 1000),'America/Chicago').format("h:mmA");
        } else if( trip.stop.arrival ) {
            return moment.tz(new Date(trip.stop.arrival.time.low * 1000),'America/Chicago').format("h:mmA");
        } else {
            return "0:00am";
        }
    
        const minutes = Math.round((trip.stop.departure.time.low - trip.feed_time.low) / 60);
    
    }

    // 
    // convenience for determining the number of minutes until the 
    // bus arrives at the stop
    //
    this.computeTimeDelta = (trip) => {

        // note that the epoch times in the GTFS data are in seconds
        let arrival_time;
        if( trip.stop.departure ) {
            return Math.round((trip.stop.departure.time.low - trip.feed_time.low) / 60);
        } else if( trip.stop.arrival ) {
            return Math.round((trip.stop.arrival.time.low - trip.feed_time.low) / 60);
        } else {
            return -999;
        }
    
    }

    
}
module.exports = Trips;



