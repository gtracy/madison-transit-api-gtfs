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
const TABLE_NAME = 'Trips_gtfs';

const Fs = require('fs');
const CsvReadableStream = require('csv-reader');

let config = require('../config');
let AWS = require('aws-sdk');
//AWS.config.update({region: config.aws.region});
AWS.config.update({
    region: "local",
    endpoint: "http://localhost:8000"
});
// Create DynamoDB document client
let dynamoClient = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});

// prompt for script inputs

(async () => {
    const input_file = '../gtfs/trips.txt';
    const batch_size = 25;
    let batch_num = 1;
    let write_bucket = [];
    let promises = [];
    const concurrentRequests = 25;

    let inputStream = Fs.createReadStream(input_file, 'utf8');
    let csvStream = new CsvReadableStream({ skipHeader: true, asObject: true, trim: true });
    inputStream
        .pipe(csvStream)
        .on('open', () => {
            console.log('file opened!');
        })
        .on('end', async function () {
            if (promises.length > 0) {
                console.log('\nawaiting write to DynamoDB\n')
                await Promise.all(promises);
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
                console.log(` batch ${batch_num}`)
                csvStream.pause();
                promises.push(saveToDynamoDB(write_bucket));
                if (promises.length % concurrentRequests === 0) {
                    console.log('\nawaiting write requests to DynamoDB\n');
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

})();
