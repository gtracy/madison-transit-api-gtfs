'use strict';

const config = require('./config');
const express = require('express');
const app = express();

// API endpoint registration
require('./api/schedule')(app);
require('./api/stops')(app);

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
