"use strict";

var utils = require('../utils'),
    configuration = require('../configuration');

/**
 * @TODO Expands the handling of parameters: allow a conf object, allow an instance of the hull client
 */
module.exports = function authenticate(deserializer, appId, secret) {

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
    if (secret) {
      conf.appSecret = secret;
    }
    if(appId) {
      conf.appId = appId;
    }
    conf = configuration.extend(confExt);
    configuration.check(conf, ['appSecret', 'appId']);
    var cookieName = "hull_" + appId;
    var signedUser = parseSignedCookie(req.cookies[cookieName]);
    req.hull = req.hull || {};
    var userId;
    if (signedUser) {
      userId = utils.checkSignedUserId(signedUser['Hull-User-Id'], signedUser['Hull-User-Sig'], conf.appSecret);
      req.hull.userId = userId;
    }
    if (userId && typeof deserializer === 'function') {
      deserializer(userId, function(err, user) {
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
