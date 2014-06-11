"use strict";

var uri     = require('url'),
    request = require('superagent'),
    configuration = require('./configuration'),
    slice   = [].slice,
    noop = function () {};

function genericRequest(/*method, conf, path, params, callback*/) {
  var args = slice.call(arguments),
      method = args.shift(),
      conf = args.shift(),
      path = args.shift(),
      params,
      callback;

  while (args.length) {
    var typeOfArg = typeof args[0];
    if (params && callback) {
      break;
    }
    if (typeOfArg === 'object') {
      params = args.shift();
    }
    if (typeOfArg === 'function') {
      callback = args.shift();
    }
  }

  conf = configuration.extend(conf);
  configuration.check(conf, ['appId', 'orgUrl', 'appSecret', 'version']);

  var orgUrl = uri.parse(conf.orgUrl);

  // Prefix path with a '/' if it's not there.
  if (path[0] !== '/') path = "/" + path;
  path = "/api/v1" + path;

  var url = uri.resolve(orgUrl.protocol + "//" + orgUrl.host, path);

  var req = request[method](url)
    .set('Content-Type', 'application/json')
    .set('Hull-App-Id', conf.appId)
    .set('Hull-Access-Token', conf.appSecret)
    .set('User-Agent', 'Hull Node Client v' + conf.version);

  if (req.method === 'GET') {
    req.query(params);
  } else {
    req.send(params);
  }

  return req.end(function (err, res) {
      (callback || noop)(err || res.error || null, (res && res.body) || null, res);
    });
}

function prepareRequest(method, config) {
  return genericRequest.bind(undefined, method, config);
}

module.exports = prepareRequest;
