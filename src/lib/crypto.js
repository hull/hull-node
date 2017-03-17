import _ from "lodash";
import crypto from "crypto";
import jwt from "jwt-simple";


function getSecret(config = {}, secret) {
  return secret || config.accessToken || config.secret;
}
function sign(config, data) {
  if (!_.isString(data)) {
    throw new Error("Signatures can only be generated for Strings");
  }
  const sha1 = getSecret(config);
  return crypto
  .createHmac("sha1", sha1)
  .update(data)
  .digest("hex");
}
function checkConfig(config) {
  if (!config || !_.isObject(config) || !config.id || !config.secret) {
    throw new Error(`invalid config in Crypto: ${JSON.stringify(config)}`);
  }
}

function buildToken(config, claims = {}) {
  if (claims.nbf) { claims.nbf = Number(claims.nbf); }
  if (claims.exp) { claims.exp = Number(claims.exp); }
  const iat = Math.floor(new Date().getTime() / 1000);
  const claim = {
    iss: config.id,
    iat,
    ...claims
  };
  return jwt.encode(claim, getSecret(config));
}

module.exports = {
  sign(config, data) {
    checkConfig(config);
    return sign(config, data);
  },

  /**
   * Calculates the hash for a user lookup - io.hull.as
   *
   * This is a wrapper over `buildToken` method.
   * If the identClaim is a string or has id property, it's considered as an object id,
   * and its value is set as a token subject.
   * Otherwise it verifies if required ident properties are set
   * and saves them as a custom ident claim.
   *
   * @param {Object} config object
   * @param {String} type - "user" or "account"
   * @param {String|Object} identClaim main idenditiy claim - object or string
   * @param {Object} additionalClaims
   * @returns {String} The jwt token to identity the user.
   */
  lookupToken(config, type, identClaim, additionalClaims = {}) {
    type = _.toLower(type);
    if (!_.includes(["user", "account"], type)) {
      throw new Error("Lookup token supports only `user` and `account` types");
    }

    checkConfig(config);
    const claims = {};
    if (_.isString(identClaim)) {
      if (!identClaim) { throw new Error(`Missing ${type} ID`); }
      claims.sub = identClaim;
    } else if (identClaim.id) {
      claims.sub = identClaim.id;
    } else {
      if (type === "user"
        && (!_.isObject(identClaim) || (!identClaim.email && !identClaim.external_id && !identClaim.anonymous_id))) {
        throw new Error("You need to pass a user hash with an `email` or `external_id` or `anonymous_id` field");
      }

      claims[`io.hull.as${_.upperFirst(type)}`] = identClaim;
    }

    if (_.has(additionalClaims, "create")) {
      claims["io.hull.create"] = additionalClaims.create;
    }

    if (_.has(additionalClaims, "active")) {
      claims["io.hull.active"] = additionalClaims.active;
    }

    return buildToken(config, claims);
  },

  /**
   * Checks the signed userId - used in middleware to authenticate the current user locally via signed cookies.
   *
   * @param {String} userId.  the userId to check
   * @param {String} userSig. the signed userId
   * @returns {String|Boolean} the userId if the signature matched, false otherwise.
   */
  currentUserId(config, userId, userSig) {
    checkConfig(config);
    if (!userId || !userSig) { return false; }
    const [time, signature] = userSig.split(".");
    const data = [time, userId].join("-");
    return sign(config, data) === signature;
  }
};
