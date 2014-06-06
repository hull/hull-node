"use strict";

var client = require('./client'),
    conf = require('./configuration'),
    buildAccessToken = require('./utils').buildAccessToken;

// @TODO Allow to default the configuration
module.exports = client;
module.exports.conf = conf.defaults;
module.exports.client = client;
module.exports.as = function (userId) {
  var config = conf.extend({
    appSecret: buildAccessToken(conf.get(), userId)
  });
  return client(config);
};
module.exports.utils = require('./utils');
module.exports.middleware = require('./middleware/current_user');
