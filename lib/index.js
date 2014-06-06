"use strict";

var client = require('./client'),
    conf = require('./configuration'),
    jwt = require('jwt-simple');

// @TODO Allow to default the configuration
module.exports = client;
module.exports.conf = conf.defaults;
module.exports.client = client;
module.exports.as = function (userId) {
  var iat = Math.round(new Date().getTime() / 1000);
  var exp = iat + 600;
  var config = conf.extend({userId: userId});
  config.appSecret = jwt.encode({
    iss: config.appId,
    sub: userId,
    iat: iat,
    exp: exp
  }, config.appSecret);
  return client(config);
};
module.exports.utils = require('./utils');
module.exports.middleware = require('./middleware/current_user');
