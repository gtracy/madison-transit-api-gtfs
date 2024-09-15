'use strict';

const got = require('got');
const Fs = require('fs');
const CsvReadableStream = require('csv-reader');
const {performance} = require('perf_hooks');

//const GTFS_API_URL_BASE = "https://api.smsmybus.com/v1/";
const GTFS_API_URL_BASE = "http://localhost:3300/v1/";
const DEV_KEYS = ["mookie"];

// record the results
console.log('api,execution,key,stopCode,status,routeCount');
(async () => {
    let stop_codes = [];
    let location_errors = 0;
    let arrival_errors = 0;

    try {
        stop_codes = await parseStopsFile();
        for( let i=0; i<stop_codes.length; i++ ) {
            let req_url,startTime,response,endTime;
            let node_time, old_time;

            // randmoly select a devkey and stopCode
            const devkey = DEV_KEYS[Math.floor(Math.random()*DEV_KEYS.length)];
            const stopCode = stop_codes[Math.floor(Math.random()*stop_codes.length)];

            // call the new node implementation - getarrivals
            req_url = GTFS_API_URL_BASE + "getarrivals" + "?key=" + devkey + "&stopID=" + stopCode;
            startTime = performance.now();
            response = await got(req_url,{responseType:'json'});
            if( response.body.status < 0 ) {
                // this API version should never, ever fail for these stopCode
                console.log('node,getarrivals,'+devkey+','+stopCode+',-1,0');
                arrival_errors++;
                console.dir(response.body);
            } else {
                endTime = performance.now();
                console.log(`node,getarrivals,${endTime - startTime},${devkey},${stopCode},${response.body.status},${response.body.stop.route.length}`);
            }

            // call the new node implementation - getstoplocation
            req_url = GTFS_API_URL_BASE + "getstoplocation" + "?key=" + devkey + "&stopID=" + stopCode;
            startTime = performance.now();
            response = await got(req_url,{responseType:'json'});
            if( response.body.status < 0 || response.body.stopID !== stopCode ) {
                // this API version should never, ever fail for these stopCode
                console.log('node,getstoplocation,'+devkey+','+stopCode+',-1,0');
                location_errors++;
                console.dir(response.body);
            } else {
                endTime = performance.now();
                console.log(`node,getstoplocation,${endTime - startTime},${devkey},${stopCode},${response.body.status}`);
            }
            //if(i>4)break;
        }

        // now test a fake stopid and make sure the server won't crash
        const devkey = DEV_KEYS[Math.floor(Math.random()*DEV_KEYS.length)];
        const stopCode = '9999';

        // call the new node implementation - getarrivals
        let req_url = GTFS_API_URL_BASE + "getarrivals" + "?key=" + devkey + "&stopID=" + stopCode;
        let response = await got(req_url,{responseType:'json'});
        if( response.body.status < 0 ) {
            console.log('API correctly failed for stop '+stopCode);
            console.dir(response.body);
        } else {
            arrival_errors++;
            console.log('Stop '+stopCode+' should never succeed');
        }

    } catch (err) {
        console.dir(err);
    }
    console.log('\nResults: '+stop_codes.length+' tests run');
    console.log('getarrivals error count: '+arrival_errors);
    console.log('getlocation error count: '+location_errors);

})();


async function parseStopsFile() {

    return new Promise( (resolve,reject) => {
        const stopsFile = "./gtfs/stops.txt";
        let stops = [];

        // read the file like a CSV file and only extract the stop_id
        let inputStream = Fs.createReadStream(stopsFile, 'utf8');
        let csvStream = new CsvReadableStream({ skipHeader: true, asObject: true, trim: true });
        inputStream
            .pipe(csvStream)
            .on('end', async function () {
                console.log('No more rows!');
                resolve(stops);
            })
            .on('error', (err) => {
                console.error('Failed to read the input file ' + stopsFile);
                console.dir(err);
            })
            .on('data', async function (row) {
                stops.push(row.stop_code);
            });
    });
}
