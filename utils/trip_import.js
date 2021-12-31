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
const Fs = require('fs');
const CsvReadableStream = require('csv-reader');
const prompt = require('prompt-sync')({sigint: true});

let config = require('../config');
let Trips = require('../lib/trips');

let AWS = require('aws-sdk');
AWS.config.update(config.getAWSConfig())
let ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
let dynamoClient = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});

console.log("\nAWS config :");
console.dir(config.getAWSConfig());

(async () => {

    let trips = new Trips();
    const TABLE_NAME = trips.getTableName();
    const batch_size = 25;
    let batch_num = 1;
    let write_bucket = [];
    let promises = [];
    const concurrentRequests = 25;

    // let's make sure the table has been created
    var params = {
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
    
    console.log("\ningest the GTFS Trips file into DynamoDB.");
    console.log("... create the table if it doesn't already exist");
    let aws_result = await ddb.createTable(params, async function(err, data) {
        if (err) {
            if( !(err.code === "ResourceInUseException") ) {
                // totally fine if the table already exists. 
                // otherwise, exit.
                console.dir(err);
                process.exit(1);
            } else {
                console.error("... table " + params.TableName + " already exists");
            }
        } else {
            console.log("Created table. Table description JSON:", JSON.stringify(data, null, 2));
            console.log("... take a quick break, and give AWS a chance to create the table ...");
            await new Promise(r => setTimeout(r, 5000));
        }

        let default_input = './gtfs/trips.txt';            
        var inputGTFSFile = prompt("\nGTFS file input ["+default_input+"] : ",default_input);
        console.log(`\n... reading GTFS data from ${inputGTFSFile}`);
        console.log("... this task of writing to Dynamo is going to take a little while!");

        let inputStream = Fs.createReadStream(inputGTFSFile, 'utf8');
        let csvStream = new CsvReadableStream({ skipHeader: true, asObject: true, trim: true });
        inputStream
            .pipe(csvStream)
            .on('open', () => {
                console.log('file opened!');
            })
            .on('end', async function () {
                if (promises.length > 0) {
                    console.log('... awaiting write to DynamoDB\n')
                    await Promise.all(promises);
                }

                // flush any remnents
                if (write_bucket.length > 0) {
                    console.log('... found sme remnents. saving these now.');
                    await saveToDynamoDB(write_bucket);
                }
                console.log('No more rows!');
            })
            .on('error', (err) => {
                console.error('Failed to read the input file ' + input_file);
                console.dir(err);
            })
            .on('data', async function (row) {
                //console.log('A row arrived: ');
                write_bucket.push(row);

                // if it is valid, push it into our write bucket
                if (write_bucket.length % batch_size === 0) {
                    console.log(`    batch ${batch_num}`)
                    csvStream.pause();
                    promises.push(saveToDynamoDB(write_bucket));
                    if (promises.length % concurrentRequests === 0) {
                        console.log('... awaiting write requests to DynamoDB\n');
                        await Promise.all(promises);
                        promises = [];
                    }
                
                    write_bucket = [];
                    batch_num++;
                    csvStream.resume();
                }
            });
            

        async function saveToDynamoDB(batch) {
            const putReqs = batch.map(item => ({
                PutRequest: {
                Item: item
                }
            }))
            
            const req = {
                RequestItems: {
                [TABLE_NAME]: putReqs
                }
            }
            
            await dynamoClient.batchWrite(req).promise();
            console.log('  batch of ' + batch.length + ' written to dynamo');
        }
    });

})();
