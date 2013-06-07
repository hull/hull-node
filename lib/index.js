"use strict";

var version     = require('package.json').version,
    buildRequest = require('./request');


/**
 * This is a client for all Hull.io operations in Node.js
 * @param {Object} conf The configuration for the client
 * @TODO Checks the presence of thw required config
 * @TODO Testing
 */
function Hull(conf) {
  if (!(this instanceof Hull)) {
    return new Hull(conf);
  }
  this.version        = version;
  this.conf           = Object.freeze(conf);

  var requestsConfig  = {
    appId: this.conf.appId,
    orgUrl: this.conf.orgUrl,
    appSecret:this.conf.appSecret,
    version: this.version
  };

  ['get', 'post', 'put', 'delete'].forEach(function (method) {
    this[method] = buildRequest(method, requestsConfig);
  }, this);
}

// @TODO Allow to default the configuration
module.exports = Hull;
module.exports.client = Hull;
module.exports.utils = require('./utils');
module.exports.middleware = require('./middleware/current_user');
