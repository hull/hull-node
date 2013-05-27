var crypto = require('crypto');

/**
 * This is a client for all Hull.io operations in Node.js
 * @param {Object} conf The configuration for the client
 * @TODO Checks the presence of thw required config
 * @TODO Testing
 */
function Client (conf) {

  /**
   * Calculates the hash for a user so an external userbase can be linked to hull.io services
   *
   * @param {mixed} user The derscription of the user. Developers are free to use the keys they see fit, as long as it is JSON.stringify'able.
   * @returns {String} The hash to identity the user
   */
  this.getUserHash = function (user) {
    var timestamp = Date.now();
    var message = (new Buffer(JSON.stringify(user))).toString('base64');
    var signature = crypto.createHmac('sha1', conf.appSecret).update([message, timestamp].join(' ')).digest('hex');
    var parts = [
      message,
      signature,
      timestamp
    ];
    return parts.join(' ');
  };

}

exports = module.exports = function (conf) {
  //Generates a new client with the configuration passed
  return new Client(conf);
};
