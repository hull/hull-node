"use strict";

var _ = require('underscore');
var rawBody = require('raw-body');
var crypto = require('crypto');

var webhook = function (conf, req, res, next) {
  if (conf.appId !== req.headers['hull-app-id']) {
    return next(new Error('Wrong app called'));
  }
  var sig = req.headers['hull-signature'].split('.');
  var timestamp = sig.shift();
  var nonce = sig.shift();
  var signature = sig.shift();

  function checkSignature (err, body) {
    if (err) {
      return next(err);
    }
    var data = [timestamp, nonce, body].join('-');
    var signed = crypto.createHmac('sha1', conf.appSecret).update(data).digest('hex');
    if (signed !== signature) {
      return next(new Error('Invalid signature'));
    }

    //Because we can't reuse streams and express middlewares
    //throw them away
    req.body = JSON.parse(body);
    return next();
  }

  rawBody(req, true, checkSignature);
};

module.exports = function (conf) {
  return _.partial(webhook, conf);
};
