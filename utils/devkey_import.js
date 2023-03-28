'use strict';

//
// this script is designed to read in a GTFS text file for Trips
// and populate a DynamoDB table with the items.
//
// > npm run devkey-import
//
// prompt the user for:
//   - File to import (default to Trips.txt)
//
let gtfs = require('./gtfs');
let config = require('../config');

let AWS = require('aws-sdk');
AWS.config.update(config.getAWSConfig())
console.log("\nAWS config :");
console.dir(config.getAWSConfig());

(async () => {

    const TABLE_NAME = "DeveloperKeys";

    // let's make sure the table has been created
    var params = {
        TableName : TABLE_NAME,
        KeySchema: [       
            { AttributeName: "developerKey", KeyType: "HASH"},
        ],
        AttributeDefinitions: [       
            { AttributeName: "developerKey", AttributeType: "S" },
        ],
        ProvisionedThroughput: {       
            ReadCapacityUnits: 10, 
            WriteCapacityUnits: 25
        }
    };
    
    // import the GTFS file into our new table
    try{
        await gtfs.gtfsToDynamo(AWS,"./utils/dev_keys_sample.txt",TABLE_NAME,params);
    } catch(err) {
        console.log('import failed!');
        console.log(err);
        process.exit(-1);
    }
    console.log("\nall done.\n");


})();
