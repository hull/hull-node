"use strict";

var uri     = require('url'),
    http    = require('http'),
    request = require('superagent'),
    slice   = [].slice;

function genericRequest(method, conf, path, params) {
  var orgUrl = uri.parse(conf.orgUrl);

  // Parse args to get the callback
  var args = slice.call(arguments),
      callback = args[args.length - 1];
  if (typeof callback !== 'function') callback = function() {};

  // Prefix path with a '/' if it's not there.
  if (path[0] !== '/') path = "/" + path;
  path = "/api/v1" + path;

  var url = uri.resolve(orgUrl.protocol + "//" + orgUrl.host, path);

  return request[method](url)
    .set('Content-Type', 'application/json')
    .set('Hull-App-Id', conf.appId)
    .set('Hull-Access-Token', conf.appSecret)
    .set('User-Agent', 'Hull Node Client v' + conf.version)
    .send(params)
    .end(function(res) {
      callback(res.body, res);
    });
}

function prepareRequest(method, config) {
  return genericRequest.bind(undefined, method, config);
}

module.exports = prepareRequest;
