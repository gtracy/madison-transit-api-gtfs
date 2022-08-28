'use strict';

const _ = require('underscore');
const moment = require('moment-timezone');
const config = require('../config');
const logger = require('pino')(config.getLogConfig());
const services = require('./service.json');

class _Service {
    active_service = undefined;

    constructor() {
        const now = new Date();
        this.active_service = _.find(services, (s) => {
            return (now > new Date(s.start_date) && now < new Date(s.end_date));
        });
        if( this.active_service === undefined ) {
            logger.error("FAIL : unable to determine active service");
            logger.error(services);
        } else {
            logger.debug('Active service: ');
            logger.debug(this.active_service);
        }

    }

    // 
    // utility to find the active service ID
    //
    getActiveServiceID() {
        if( this.active_service ) {
            return this.active_service.service_id;
        } else {
            logger.debug('---- missing service id ----');
            return 0;
        }
    }
}

// instantiate the singleton
var service = new _Service();
module.exports = service;
