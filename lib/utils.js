"use strict";

var crypto = require('crypto'),
    jwt = require('jwt-simple'),
    configuration = require('./configuration');

var _checkAppSecret = function (secret) {
  var conf;
  if (secret) {
    conf = configuration.extend({appSecret: secret});
  } else {
    conf = configuration.get();
  }
  configuration.check(conf, ['appSecret']);
  return conf;
};

module.exports = {
  /**
   * Calculates the hash for a user so an external userbase can be linked to hull.io services
   *
   * @param {String} userId The id of the user.
   * @param {String} secret the app secret
   * @returns {String} The signed hash to identity the user.
   * @TODO Check if this works with only an email as the id
   * @TODO Check if this works with only a numeric id
   */
  signUserData: function (userData, secret) {
    var conf = _checkAppSecret(secret);
    configuration.check(userData, ['email']);
    var timestamp = Math.round(new Date().getTime() / 1000);
    var message   = (new Buffer(JSON.stringify(userData))).toString('base64');
    var signature = crypto.createHmac('sha1', secret || conf.appSecret).update([message, timestamp].join(' ')).digest('hex');
    var parts = [
      message,
      signature,
      timestamp
    ];
    return parts.join(' ');
  },

  /**
   * Checks the signed userId - used in middleware to authenticate the current user locally via signed cookies.
   *
   * @param {String} userId.  the userId to check
   * @param {String} userSig. the signed userId
   * @param {String} secret the app secret
   * @returns {String|Boolean} the userId if the signature matched, false otherwise.
   */
  checkSignedUserId: function(userId, userSig, secret) {
    var conf = _checkAppSecret(secret);
    if (!userId || !userSig) { return false; }
    var sig       = userSig.split("."),
        time      = sig[0],
        signature = sig[1],
        digest    = crypto.createHmac('sha1', conf.appSecret).update([time, userId].join("-")).digest('hex');

    if (digest === signature) {
      return userId;
    } else {
      return false;
    }
  },
  buildAccessToken: function (config, userId) {
    var iat = Math.round(new Date().getTime() / 1000);
    return jwt.encode({
      iss: config.appId,
      sub: userId,
      iat: iat,
      exp: iat + 600
    }, config.appSecret);
  }
};
