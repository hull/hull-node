var crypto = require('crypto');

/**
 * This is a client for all Hull.io operations in Node.js
 * @param {Object} conf The configuration for the client
 * @TODO Checks the presence of thw required config
 * @TODO Testing
 */
function Hull(conf) {
  this.conf = Object.freeze(conf);
}

Hull.prototype = {
  /**
   * Calculates the hash for a user so an external userbase can be linked to hull.io services
   *
   * @param {mixed} user The description of the user (must include `id`, `name` and `email`).
   * @returns {String} The signed hash to identity the user.
   */
  getUserHash: function (user) {
    var timestamp = Math.round(new Date().getTime() / 1000);
    var message   = (new Buffer(JSON.stringify(user))).toString('base64');
    var signature = crypto.createHmac('sha1', this.conf.appSecret).update([message, timestamp].join(' ')).digest('hex');
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
   * @returns {String|Boolean} the userId if the signature matched, false otherwise.
   */
  checkSignedUserId: function(userId, userSig) {
    if (!userId || !userSig) { return false; }
    var sig       = userSig.split("."),
        time      = sig[0], 
        signature = sig[1],
        digest    = crypto.createHmac('sha1', this.conf.appSecret).update([time, userId].join("-")).digest('hex');

    if (digest == signature) {
      return userId;
    } else {
      return false;
    }
  },


  authenticateUser: function() {
    var authMiddleware = require('./middleware/authenticate');
    return authMiddleware(this);
  }

};

module.exports = Hull;
