'use strict';

let _ = require('underscore');
let AWS = require('aws-sdk');
let config = require('../config');

AWS.config.update(config.getAWSConfig());
let ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

const TABLE_NAME = 'DeveloperKeys';

//
// we have a dynamo table that stores all valid developer keys
// we need to cash these at some point. in the mean time, the MVP
// will simply grab the frequently used keys from an environment 
// variable
//
module.exports.validateDevKey = async function(req,res,next) {

        const dev_key = req.query.key.toLowerCase();

        req.log.debug('validating dev key: ' + dev_key);
        if( !dev_key ) {
            return next('Missing dev key (?key=) in request');
        } else {

            try {
                // hacky cache : do a lookup on the local devkey object
                let env_key_list = [];
                if( process.env.DEV_KEYS ) {
                    req.log.debug(process.env.DEV_KEYS);
                    env_key_list = process.env.DEV_KEYS.split(',');
                }

                if( _.find(env_key_list, (key) => {
                          return key === dev_key;
                   })) {
                    req.log.debug('found devKey in the local cache');
                    next();
                } else {
                    // lookup in dynamo next
                    let params = {
                        TableName: TABLE_NAME,
                        Key : {
                            developerKey: {S : dev_key}
                        }
                    };
                    let aws_result = await ddb.getItem(params).promise();

                    if( aws_result.Item) {
                        req.log.debug('dev key valid!');
                        next();
                    } else {
                        req.log.error('failed to lookup devKey '+dev_key);
                        next('Invalid devKey in request');
                    }

                }
            } catch(err) {
                next(err);
            }
        }

}

