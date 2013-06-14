"use strict";

var client = require('./client'),
    conf = require('./configuration');

// @TODO Allow to default the configuration
module.exports = client;
module.exports.conf = conf.defaults;
module.exports.client = client;
module.exports.utils = require('./utils');
module.exports.middleware = require('./middleware/current_user');
