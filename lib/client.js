"use strict";

var version = require('../package.json').version,
    buildRequest = require('./request'),
    configuration = require('./configuration');

/**
 * This is a client for all Hull.io operations in Node.js
 * @param {Object} conf The configuration for the client
 * @TODO Checks the presence of thw required config
 * @TODO Testing
 */
function Client(conf) {
  if (!(this instanceof Client)) {
    return new Client(conf);
  }

  configuration.check(conf);

  this.version        = version;
  this.conf           = Object.freeze(conf);
  var requestsConfig  = {
    appId: conf.appId,
    orgUrl: conf.orgUrl,
    appSecret: conf.appSecret,
    version: version
  };

  ['get', 'post', 'put', 'delete'].forEach(function (method) {
    this[method] = buildRequest(method, requestsConfig);
  }, this);
}

module.exports = Client;
