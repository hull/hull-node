"use strict";

var client = require('./client');

// @TODO Allow to default the configuration
module.exports = client;
module.exports.client = client;
module.exports.utils = require('./utils');
module.exports.middleware = require('./middleware/current_user');
