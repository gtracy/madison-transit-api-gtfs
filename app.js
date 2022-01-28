'use strict';

const config = require('./config');
const express = require('express');
const cors = require('cors');
const pino = require('pino-http')(config.getLogConfig());

const app = express();
app.use(pino);
app.use(cors({
    origin: '*',
    methods: 'GET',
    allowedHeaders: 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    preflightContinue: true
}));

// API endpoint registration
require('./api/schedule')(app);
require('./api/vehicles')(app);
require('./api/stops')(app);
require('./api/parking')(app);

// API backstop
app.get('*', function(req,res) {
    res.json({
        "status": -1,
        "description": 'unsupported endpoint'
    });
});

// error handler
app.use(function (err, req, res, next) {
    res.json({
        "status": -1,
        "description": err
    });
});

module.exports = app;
