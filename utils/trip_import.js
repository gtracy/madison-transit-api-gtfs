'use strict';

//
// this script is designed to read in a GTFS text file for Trips
// and populate a DynamoDB table with the items.
//
// > npm run trip-import
//
// prompt the user for:
//   - File to import (default to trips.txt)
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
            WriteCapacityUnits: 25
        }
    };

    // import the GTFS file into our new table
    try{
        let input_file = "gtfs/trips.txt";
        // test if user is parsing a non-default GTFS file
        if( process.argv[2] ) {
            input_file = process.argv[2];
        }    
        await gtfs.gtfsToDynamo(AWS,input_file,TABLE_NAME,table_params);
    } catch(err) {
        console.log('import failed!');
        console.log(err);
        process.exit(-1);
    }


})();
