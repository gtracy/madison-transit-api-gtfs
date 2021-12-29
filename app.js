'use strict';

const config = require('./config');
const express = require('express');
const app = express();

// API endpoint registration
require('./api/schedule')(app);

module.exports = app;
