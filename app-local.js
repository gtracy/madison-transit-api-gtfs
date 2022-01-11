'use strict'

const config = require('./config');
const app = require('./app');
const logger = require('pino')(config.getLogConfig());

app.listen(config.getPort(), () => {
    logger.debug('app running in ' + config.getEnv());
    logger.debug('logger set to '+config.getLogConfig().level);
    logger.debug(config.getAWSConfig());
    logger.debug(`Server starting on port ${config.getPort()}.`);
});
