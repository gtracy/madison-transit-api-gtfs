'use strict';

const got = require('got');
const Fs = require('fs');
const CsvReadableStream = require('csv-reader');
const {performance} = require('perf_hooks');

//const GTFS_API_URL_BASE = "https://api.smsmybus.com/v1/";
const GTFS_API_URL_BASE = "http://localhost:3300/v1/";
const OLD_API_URL = "https://api.smsmybus.com/v1/getarrivals";
const DEV_KEYS = ["nomar","wisc81jw","willycoop","taylorhall-wisc","rwf34e9a","b24jk9a4","mfoolskiosk"];

// record the results
console.log('api,execution,key,stopID,status,routeCount');
(async () => {
    let stop_ids = [];

    try {
        stop_ids = await parseStopsFile();
        console.log(stop_ids.length);

        for( let i=0; i<stop_ids.length; i++ ) {
            let req_url,startTime,response,endTime;
            let node_time, old_time;

            // randmoly select a devkey and stopid
            const devkey = DEV_KEYS[Math.floor(Math.random()*DEV_KEYS.length)];
            const stopID = stop_ids[i];//STOP_IDS[Math.floor(Math.random()*STOP_IDS.length)];

            // call the new node implementation - getarrivals
            req_url = GTFS_API_URL_BASE + "getarrivals" + "?key=" + devkey + "&stopID=" + stopID;
            startTime = performance.now();
            response = await got(req_url,{responseType:'json'});
            if( response.body.status < 0 ) {
                // this API version should never, ever fail for these stopID
                console.log('node,0,'+devkey+','+stopID+',-1,0');
            } else {
                endTime = performance.now();
                console.log(`node,getarrivals,${endTime - startTime},${devkey},${stopID},${response.body.status},${response.body.stop.route.length}`);
            }

            // call the new node implementation - getstoplocation
            req_url = GTFS_API_URL_BASE + "getstoplocation" + "?key=" + devkey + "&stopID=" + stopID;
            startTime = performance.now();
            response = await got(req_url,{responseType:'json'});
            if( response.body.status < 0 ) {
                // this API version should never, ever fail for these stopID
                console.log('node,0,'+devkey+','+stopID+',-1,0');
            } else {
                endTime = performance.now();
                console.log(`node,getstoplocation,${endTime - startTime},${devkey},${stopID},${response.body.status}`);
            }
            
            // call the old python implementation
            // note that thie old implementation is dated and does not support all of 
            // the stop IDs found in the up to date GTFS file. ignore these errors.`
            // req_url = OLD_API_URL + "?key=" + devkey + "&stopID=" + stopID;
            // startTime = performance.now();
            // response = await got(req_url,{responseType:'json'});
            // if( response.body.status < 0 ) {
            //     // this API version should never, ever fail for these stopID
            //     console.log('old,0,'+devkey+','+stopID+',-1,0');
            // } else {
            //     endTime = performance.now();
            //     console.log(`old,${endTime - startTime},${devkey},${stopID},${response.body.status},${response.body.stop.route.length}`);
            // }

        }
    } catch (err) {
        console.dir(err);
    }

})();


async function parseStopsFile() {

    return new Promise( (resolve,reject) => {
        const stopsFile = "../gtfs/stops.txt";
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
                stops.push(row.stop_id);
            });
    });
}
