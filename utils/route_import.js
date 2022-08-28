'use strict';

const Routes = require('../lib/routes');

//
//  usage : node utils/route_import.js
//
// warning : this won't work with nodemon due to a known bug in prompt-sync
//   https://github.com/heapwolf/prompt-sync/issues/50
//
//
(async () => {
    console.log("\ntransform the GTFS routes file into a json object for deployment.");

    // default values for file input and output
    let input_file = './gtfs/routes.txt';
    let default_output = './lib/routes.json';
    // test if user is parsing a non-default GTFS file
    if( process.argv[2] ) {
        input_file = process.argv[2];
    }    
    console.log(`\nreading GTFS data from ${input_file}`);
    console.log(`exporting JSON to ${default_output}\n`);

    await Routes.transformGTFSFile(input_file,default_output);
    console.log("\nall finished with ingestion task!\n");

})();


