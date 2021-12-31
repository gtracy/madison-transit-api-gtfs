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
const Fs = require('fs');
const CsvReadableStream = require('csv-reader');
const prompt = require('prompt-sync')({sigint: true});

let config = require('../config');

let AWS = require('aws-sdk');
AWS.config.update(config.getAWSConfig())
let ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
let dynamoClient = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});

console.log("\nAWS config :");
console.dir(config.getAWSConfig());

(async () => {

    const TABLE_NAME = "DeveloperKeys";
    const batch_size = 25;
    let batch_num = 1;
    let write_bucket = [];
    let promises = [];
    const concurrentRequests = 25;

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
            WriteCapacityUnits: concurrentRequests
        }
    };
    
    console.log("\ningest an existing dev key list into DynamoDB (not required).");
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
            console.log("Created table. Table description JSON: ", JSON.stringify(data, null, 2));
            console.log("... take a quick break, and give AWS a chance to create the table ...");
            await new Promise(r => setTimeout(r, 5000));
        }

        var input_file = prompt("Dev key file input (not required): ");
        if( input_file ) {
            console.log(`\n... importing devkey data from ${input_file}`);

            let inputStream = Fs.createReadStream(input_file, 'utf8');
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
                    // the date field in the GCP file is goofy. fix it before pushing into dynamo
                    let date_added = row.dateAdded.split(' ');
                    row.dateAdded = date_added[0];

                    // push in new table row
                    //console.dir(row);
                    write_bucket.push(row);

                    // if it is valid, push it into our write bucket
                    if (write_bucket.length % batch_size === 0) {
                        csvStream.pause();
                        console.log(`    batch ${batch_num}`)

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
        }
    });

})();
