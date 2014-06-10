var client = require('../client'),
    conf = require('../configuration'),
    buildAccessToken = require('../utils').buildAccessToken,
    _ = require('underscore'),
    traitMixin = require('../traits');

/*
 * This function creates a client for which
 * all requests will be performed as the Hull User
 * passed in parameter
 * @param userId {String} Hull user ID
 */
function buildClientAsUser (userId) {
  var config = conf.extend({
    appSecret: buildAccessToken(conf.get(), userId)
  });
  return _.extend(client(config), traitMixin);
};

module.exports = buildClientAsUser;
