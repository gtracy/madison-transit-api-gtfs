'use strict';

//
// this script is designed to create a Dynamo table used
// to log the API requests that are received
//
// > npm run request-log-create
//
let gtfs = require('./gtfs');
let config = require('../config');

let AWS = require('aws-sdk');
AWS.config.update(config.getAWSConfig())
console.log("\nAWS config :");
console.dir(config.getAWSConfig());

(async () => {
    let ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

    const TABLE_NAME = "API_request_log";
    var params = {
        TableName : TABLE_NAME,
        KeySchema: [       
            { AttributeName: "id", KeyType: "HASH"},
            { AttributeName: "stopid", KeyType: "RANGE"},
        ],
        AttributeDefinitions: [       
            { AttributeName: "id", AttributeType: "S" },
            { AttributeName: "stopid", AttributeType: "S" },
        ],
        ProvisionedThroughput: {       
            ReadCapacityUnits: 10, 
            WriteCapacityUnits: 25
        }
    };
    
    console.log("\n... create the table if it doesn't already exist");
    try {
        let aws_result = await ddb.createTable(params, async (err, data) => {
            if (err) {
                if( !(err.code === "ResourceInUseException") ) {
                    // totally fine if the table already exists. 
                    // otherwise, exit.
                    console.log('\nFAIL: unable to create table');
                    console.dir(err);
                    process.exit(1);
                } else {
                    console.error("... table " + dynamo_table + " already exists");
                }
            } else {
                console.log("Created table. Table description JSON:", JSON.stringify(data, null, 2));
            }
        });
    } catch(err) {
        console.log('\nFAIL: unable to create table');
        console.dir(err);
    }
    console.log("\nall done.\n");


})();
