'use strict';

const config = require('./config');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors({
    origin: '*',
    methods: 'GET',
    allowedHeaders: 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    preflightContinue: true
}));

// API endpoint registration
require('./api/schedule')(app);
require('./api/stops')(app);
require('./api/parking')(app);

// API backstop
app.get('*', function(req,res) {
    res.status(200).send("hello");
});

// error handler
app.use(function (err, req, res, next) {
    console.log('something went sideways and we are failing');
    console.log(err);
    res.send({
        "status": -1,
        "description": err
    });
});

module.exports = app;
