"use strict";

var utils = require('../utils'),
    configuration = require('../configuration'),
    slice = [].slice;

/**
 * @TODO Expands the handling of parameters: allow a conf object, allow an instance of the hull client
 */
module.exports = function authenticate(/*appId, secret, deserializer*/)  {
  var argsOrder = ['appId', 'secret', 'deserializer'];
  var argsArray = slice.call(arguments);
  var namedArgs = {};
  argsOrder.forEach(function (arg) {
    namedArgs[arg] = undefined;
  });
  while (argsArray.length) {
    namedArgs[argsOrder.pop()] = argsArray.pop();
  }

  function parseSignedCookie(signedCookie) {
    if (!signedCookie) { return; }
    try {
      return JSON.parse(new Buffer(signedCookie, 'base64').toString('utf8'));
    } catch(e) {
      console.warn("Error parsing signed cookie", signedCookie, e.message);
    }
  }

  return function(req, res, next) {
    var confExt = {};
    if (namedArgs.secret) {
      confExt.appSecret = namedArgs.secret;
    }
    if (namedArgs.appId) {
      confExt.appId = namedArgs.appId;
    }
    var conf = configuration.extend(confExt);
    configuration.check(conf, ['appSecret', 'appId']);
    var cookieName = "hull_" + conf.appId;
    var signedUser = parseSignedCookie(req.cookies[cookieName]);
    req.hull = req.hull || {};
    var userId;
    if (signedUser) {
      userId = utils.checkSignedUserId(signedUser['Hull-User-Id'], signedUser['Hull-User-Sig'], conf.appSecret);
      req.hull.userId = userId;
    }
    if (userId && typeof namedArgs.deserializer === 'function') {
      namedArgs.deserializer(userId, function(err, user) {
        if (err) {
          return next(err);
        }
        req.hull.user = user;
        next();
      });
    } else {
      next();
    }
  };
};
