'use strict';

const _ = require('underscore');
const moment = require('moment-timezone');
const config = require('../config');
let AWS = require('aws-sdk');

//
// overloaded object that encapsulates GTFS Stop details
//
function Stop() {
    const TABLE_NAME = 'Stops_gtfs';
    
    // Create an Amazon DynamoDB service client object.
    AWS.config.update(config.getAWSConfig());
    let ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

    this.getTableName = () => {
        return TABLE_NAME;
    }

    // fetch Trip details by tripId
    //    trip_ids is an array of GTFS trip id strings
    //
    this.fetchById = async (stop_id) => {
        let descriptions = [];

        if( !ddb ) {
            return "mocked trip description";
        } else {

            try {
                let params = {
                    TableName: TABLE_NAME,
                    Key : {
                        stop_id: {S : stop_id}
                    }
                };
                let aws_result = await ddb.getItem(params).promise();

                if( aws_result.Item) {
                    return {
                        stop_id : aws_result.Item.stop_id.S,
                        stop_name : aws_result.Item.stop_name.S,
                        stop_lat : aws_result.Item.stop_lat.S,
                        stop_lon : aws_result.Item.stop_lon.S
                    }
                } else {
                    console.log('failed to lookup details for stopID ' + stop_id);
                    return undefined;
                }
            } catch( error ) {
                console.log("Stop.fetchById failed : ", error.message);
                return undefined;
            }
            

        }
    }

}
module.exports = Stop;



