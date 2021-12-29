'use strict';

const fs = require("fs");
const _ = require('underscore');
const csvToJson = require('convert-csv-to-json');
const readline = require("readline");

var inputCSVFile = 'routes.txt';
var outputJSONFile = 'routes.json';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question("What is your name ? ", function(name) {
    rl.question("Where do you live ? ", function(country) {
        console.log(`${name}, is a citizen of ${country}`);
        rl.close();
    });
});

rl.on("close", function() {
    console.log("\nBYE BYE !!!");
    process.exit(0);
});

//csvToJson.fieldDelimiter(',').generateJsonFileFromCsv(inputCSVName,outputJSONName);
let json = csvToJson.fieldDelimiter(',').getJsonFromCsv(inputCSVFile);
console.dir(json.length);
console.dir(json[0]);
let json_small = _.map(json, (obj) => {
    return ({
        'route_id' : obj.route_id,
        'route_short_name' : obj.route_short_name,
        'route_service_name' : obj.route_service_name,
        'bikes_allowed' : obj.bikes_allowed
    });
});
console.dir(json_small[0]);
fs.writeFile(outputJSONFile, JSON.stringify(json_small), (error) => {
    if (error) throw error;
});