'use strict';

//
// this script is designed to read in a GTFS text file for Trips
// and populate a DynamoDB table with the items.
//
// > node utils/trip_import.js
//
// prompt the user for:
//   - File to import (default to Trips.txt)
//   - Dynamo table name (default to dev_ table)
//
let config = require('../config');
let gtfs = require('./gtfs');
let Trips = require('../lib/trips');

let AWS = require('aws-sdk');
AWS.config.update(config.getAWSConfig())

console.log("\nAWS config :");
console.dir(config.getAWSConfig());

(async () => {

    let trips = new Trips();
    const TABLE_NAME = trips.getTableName();

    // let's make sure the table has been created
    let table_params = {
        TableName : TABLE_NAME,
        KeySchema: [       
            { AttributeName: "trip_id", KeyType: "HASH"},  
        ],
        AttributeDefinitions: [       
            { AttributeName: "trip_id", AttributeType: "S" }
        ],
        ProvisionedThroughput: {       
            ReadCapacityUnits: 10, 
            WriteCapacityUnits: concurrentRequests
        }
    };

    // import the GTFS file into our new table
    try{
        await gtfs.gtfsToDynamo(AWS,"gtfs/trips.txt",TABLE_NAME,table_params);
    } catch(err) {
        console.log('import failed!');
        console.log(err);
        process.exit(-1);
    }
    console.log("\nall done.\n");


})();
