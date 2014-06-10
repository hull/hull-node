"use strict";

var client = require('./client'),
    clientAsUser = require('./client/as_user'),
    conf = require('./configuration');

module.exports = client;
module.exports.conf = conf.defaults;
module.exports.client = client;
module.exports.as = clientAsUser;
module.exports.utils = require('./utils');
module.exports.middleware = require('./middleware/current_user');
