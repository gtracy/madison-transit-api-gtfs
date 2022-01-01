'use strict'

const config = require('./config');
const app = require('./app');

app.listen(config.getPort(), () => {
    console.log('app running in ' + config.getEnv());
    console.log(config.getAWSConfig());
    console.log(`Server starting on port ${config.getPort()}.`);
});
