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

  conf = configuration.extend(conf);
  conf.version = version;
  configuration.check(conf, configuration.check.defaults.concat('version'));

  this.conf           = Object.freeze(conf);

  var methodsMapping = {
  	'get' : 'get',
  	'post': 'post',
  	'put' : 'put',
  	'delete' : 'del'
  };

  Object.keys(methodsMapping).forEach(function (method) {
    this[method] = buildRequest(methodsMapping[method], this.conf);
  }, this);
}

module.exports = Client;
