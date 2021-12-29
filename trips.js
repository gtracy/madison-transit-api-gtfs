'use strict';

let _ = require('underscore');
let AWS = require('aws-sdk');
let config = require('./config');


// sort key : trip_id

function Trips() {

    const TABLE_NAME = 'Trips_gtfs';

    // Create an Amazon DynamoDB service client object.
    //AWS.config.update({region: config.aws.region});
    AWS.config.update({
        region: "local",
        endpoint: "http://localhost:8000"
    });
    let ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
    //let docClient = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});

    // fetch Trip details by tripId
    //    trip_ids is an array of GTFS trip id strings
    //
    this.fetchById = async (trip_ids) => {
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
                console.log("Successfully fetched " + trip_results.length + " results from " + TABLE_NAME);
                return trip_results;
            } catch( error ) {
                console.log("Error", error);
                return [];
            }
            

        }
    }

}
module.exports = Trips;



