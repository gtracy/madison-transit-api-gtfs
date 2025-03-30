'use strict';

const _ = require('underscore');
const config = require('../config');
const logger = require('pino')(config.getLogConfig());
const fs = require("fs");
const csvToJson = require('convert-csv-to-json');

let AWS = require('aws-sdk');

//
// overloaded object that encapsulates GTFS Stop details
//
function _Stops() {
    const TABLE_NAME = 'Stops_gtfs';
    
    // Create an Amazon DynamoDB service client object.
    AWS.config.update(config.getAWSConfig());
    let ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

    this.getTableName = () => {
        return TABLE_NAME;
    }

    // fetch Stop details by stop_code
    //    object representing a stop's details
    //
    this.fetchByCode = async (stop_code) => {
        let descriptions = [];

        if( !ddb ) {
            return "mocked trip description";
        } else {

            try {
                let params = {
                    TableName: TABLE_NAME,
                    Key : {
                        stop_code: {S : stop_code}
                    }
                };
                let aws_result = await ddb.getItem(params).promise();

                if( aws_result.Item) {
                    return {
                        stop_id : aws_result.Item.stop_id.S,
                        stop_code : aws_result.Item.stop_code.S,
                        stop_name : aws_result.Item.stop_name.S,
                        stop_lat : aws_result.Item.stop_lat.S,
                        stop_lon : aws_result.Item.stop_lon.S
                    }
                } else {
                    logger.error('failed to lookup details for stop_code ' + stop_code);
                    return undefined;
                }
            } catch( error ) {
                logger.error("Stop.fetchByCode failed : ", error);
                return undefined;
            }
            

        }
    }

    function getIntersection(metro_intersection) {
        let index = metro_intersection.indexOf('(');
        if (index !== -1) {
            return metro_intersection.slice(0, index);
        } else {
            return metro_intersection;
        }
    }
      
    function getDirection(metro_intersection) {
        //const regex = /\(([^)]+)\)/;
        const regex = /is (north|south|east|west)bound/i;
        const match = regex.exec(metro_intersection);
        if (match && match[1]) {
            switch( match[1] ) {
                case 'east':
                    return "Eastbound";
                    break;
                case 'west':
                    return "Westbound";
                    break;
                case 'north':
                    return "North";
                    break;
                case 'southbound':
                    return "South";
                    break;
                default:
                    return match[1];
            }
        }
        return "";      
    }

    // utility function that transforms and shrinks a GTFS Stops 
    // file into a static JSON object
    this.transformGTFSFileToJSON = (gtfs_input_file,json_output_file) => {

        let json = csvToJson.fieldDelimiter(',').getJsonFromCsv(gtfs_input_file);
        console.log('total stops : '+json.length);
        console.log('sample stop transformed : ');
        console.log(json[0]);
        let json_small = _.map(json, (obj) => {
            return ({
                'stopID' : obj.stop_code, // hiding the stop_id from end user
                'stop_code' : obj.stop_code,
                'intersection' : getIntersection(obj.stop_name).trim(),
                'lat' : obj.stop_lat,
                'lon' : obj.stop_lon,
                'direction' : getDirection(obj.stop_desc),
            });
        });
        console.dir(json_small[0]);
        fs.writeFile(json_output_file, JSON.stringify(json_small), (error) => {
            if (error) throw error;
        });
    }


}
let stops = new _Stops();
module.exports = stops;



