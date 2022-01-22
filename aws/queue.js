'use strict';

let AWS = require('aws-sdk');
const moment = require('moment-timezone');

const config = require('../config');
const logger = require('pino')(config.getLogConfig());
AWS.config.update(config.getAWSConfig());

module.exports.push = async (endpoint,url,devkey,stopid) => {

    var sqs = new AWS.SQS({apiVersion: '2012-11-05'});

    var params = {
        MessageAttributes: {
            "api": {
                DataType: "String",
                StringValue: endpoint
            },
            "devkey": {
                DataType: "String",
                StringValue: devkey
            },
            "stopid": {
                DataType: "String",
                StringValue: stopid
            },
            "request_url": {
                DataType: "String",
                StringValue: url
            },
            "timestamp": {
                DataType: "String",
                StringValue: moment().tz("America/Chicago").format()
            }
        },
        MessageBody: "New API request",
        QueueUrl: config.getQueue()
    };

    try {
        let result = await sqs.sendMessage(params).promise();
        logger.info({MessageId:result.MessageId}, "queue.push() success");
        logger.debug(params);
    } catch(err) {
        logger.error(err,"queue.push() exception");
        // just swallow the error. there is no functional impact
    }

}

// lambda handler function to receive queue messages
exports.handler = async function(event, context) {
    event.Records.forEach(record => {
      const { body } = record;
      logger.info(body);
    });
    return {};
}