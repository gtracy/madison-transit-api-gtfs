'use strict';

const prompt = require('prompt-sync')({sigint: true});
const Routes = require('../routes');

//
// warning : this won't work with nodemon due to a known bug in prompt-sync
//   https://github.com/heapwolf/prompt-sync/issues/50
//
//
//  usage : node utils/route_import.js
//
//      - designed to take the prompt defaults and work just fine.
//
(async () => {

    // default values for file input and output
    let default_input = './gtfs/routes.txt';
    let default_output = './lib/routes.json';
    console.log("\ntransform the GTFS routes file into a json object for deployment.");
    console.log("  - prompt defaults will work just fine \n  - script assumes you are running this from the project's root directory\n");
    
    var inputGTFSFile = prompt("GTFS file input ["+default_input+"] : ",default_input);
    var outputJSONFile = prompt("JSON file output ["+default_output+"] : ",default_output);
    console.log(`\nreading GTFS data from ${inputGTFSFile}`);
    console.log(`exporting JSON to ${outputJSONFile}\n`);

    await Routes.transformGTFSFile(inputGTFSFile,outputJSONFile);
    console.log("\nall finished with ingestion task!\n");

})();


