let csvToJson = require('convert-csv-to-json');


var inputCSVName = 'routes.txt';
var outputJSONName = 'routes.json';
csvToJson.fieldDelimiter(',').generateJsonFileFromCsv(inputCSVName,outputJSONName);
