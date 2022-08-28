'use strict';

const fs = require("fs");
const _ = require('underscore');
const moment = require('moment-timezone');
const csvToJson = require('convert-csv-to-json');

//
// warning : this won't work with nodemon due to a known bug in prompt-sync
//   https://github.com/heapwolf/prompt-sync/issues/50
//
//
//  usage : node utils/calendar_import.js
//
//      - designed to take the prompt defaults and work just fine.
//
(async () => {
    console.log("\ntransform the GTFS routes file into a json object for deployment.");
    console.log("  - prompt defaults will work just fine \n  - script assumes you are running this from the project's root directory\n");

    // default values for file input and output
    let input_file = './gtfs/calendar.txt';
    let output_file = './lib/service.json';

    // test if user is parsing a non-default GTFS file
    if( process.argv[2] ) {
        input_file = process.argv[2];
    }
    //var outputJSONFile = prompt("JSON file output ["+default_output+"] : ",default_output);
    console.log(`\nreading GTFS data from ${input_file}`);
    console.log(`exporting JSON to ${output_file}\n`);

    let json = csvToJson.fieldDelimiter(',').getJsonFromCsv(input_file);

    // narrow the service list to the unique service ID prefixes
    //   "101_D24" --> "101"
    //
    let unique_services = _.uniq(json, (obj) => {
        const service_id = obj.service_id.split('_')[0];
        return service_id;
    });
    console.dir(unique_services);

    // export the service IDs and date ranges to a consumable JSON object
    let json_small = _.map(unique_services, (obj) => {
        return ({
            'service_id' : obj.service_id.split('_')[0],
            'start_date' : moment(obj.start_date).tz("America/Chicago").toDate(),
            'end_date'   : moment(obj.end_date).tz("America/Chicago").toDate()
        });
    });
    console.dir(json_small);

    fs.writeFile(output_file, JSON.stringify(json_small), (error) => {
        if (error) throw error;
    });


    console.log("\nall finished with ingestion task!\n");

})();


