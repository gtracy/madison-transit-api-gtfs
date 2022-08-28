'use strict';

//
// this script is designed to read in a GTFS text file for Stops
// and populate a DynamoDB table with the items.
//
// > npm run stops-import
//
// prompt the user for:
//   - File to import (default to stops.txt)
//
let gtfs = require('./gtfs');
let config = require('../config');

let AWS = require('aws-sdk');
AWS.config.update(config.getAWSConfig())
console.log("\nAWS config :");
console.dir(config.getAWSConfig());

(async () => {

    const TABLE_NAME = "Stops_gtfs";

    // let's make sure the table has been created
    var params = {
        TableName : TABLE_NAME,
        KeySchema: [       
            { AttributeName: "stop_id", KeyType: "HASH"},
        ],
        AttributeDefinitions: [       
            { AttributeName: "stop_id", AttributeType: "S" },
        ],
        ProvisionedThroughput: {       
            ReadCapacityUnits: 10, 
            WriteCapacityUnits: 25
        }
    };
    
    // import the GTFS file into our new table
    try{
        let input_file = "gtfs/stops.txt";
        // test if user is parsing a non-default GTFS file
        if( process.argv[2] ) {
            input_file = process.argv[2];
        }    
        await gtfs.gtfsToDynamo(AWS,input_file,TABLE_NAME,params);
    } catch(err) {
        console.log('import failed!');
        console.log(err);
        process.exit(-1);
    }

})();
