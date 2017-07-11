import _ from "lodash";
import pkg from "../package.json";
import crypto from "./lib/crypto";

const GLOBALS = {
  prefix: "/api/v1",
  protocol: "https"
};

const VALID_OBJECT_ID = new RegExp("^[0-9a-fA-F]{24}$");
const VALID = {
  boolean(val) {
    return (val === true || val === false);
  },
  object(val) {
    return _.isObject(val);
  },
  objectId(str) {
    return VALID_OBJECT_ID.test(str);
  },
  string(str) {
    return _.isString(str) && str.length > 0;
  },
  number(num) {
    return _.isNumber(num) && num > 0;
  }
};

const REQUIRED_PROPS = {
  id: VALID.objectId,
  secret: VALID.string,
  organization: VALID.string
};

const VALID_PROPS = {
  ...REQUIRED_PROPS,
  prefix: VALID.string,
  domain: VALID.string,
  firehoseUrl: VALID.string, // TODO: move to hull-client-node
  protocol: VALID.string,
  userClaim: VALID.object,
  accountClaim: VALID.object,
  subjectType: VALID.string,
  additionalClaims: VALID.object,
  accessToken: VALID.string,
  hostSecret: VALID.string,
  flushAt: VALID.number,
  flushAfter: VALID.number,
  connectorName: VALID.string
};

/**
 * All valid user claims, used for validation and filterind .asUser calls
 * @type {Array}
 */
const USER_CLAIMS = ["id", "email", "external_id", "anonymous_id"];

/**
 * All valid accounts claims, used for validation and filtering .asAccount calls
 * @type {Array}
 */
const ACCOUNT_CLAIMS = ["id", "external_id", "domain"];

/**
 * make sure that provided "identity claim" is valid
 * @param  {String} type          "user" or "account"
 * @param  {String|Object} object identity claim
 * @param  {Array} requiredFields fields which are required if the passed
 * claim is an object
 * @throws Error
 */
function assertClaimValidity(type, object, requiredFields) {
  if (!_.isEmpty(object)) {
    if (_.isString(object)) {
      if (!object) {
        throw new Error(`Missing ${type} ID`);
      }
    } else if (!_.isObject(object) || _.intersection(_.keys(object), requiredFields).length === 0) {
      throw new Error(`You need to pass an ${type} hash with an ${requiredFields.join(", ")} field`);
    }
  }
}

function filterClaim(object, possibleFields) {
  return _.isString(object)
    ? object
    : _.pick(object, possibleFields);
}

class Configuration {
  constructor(config) {
    if (!_.isObject(config) || !_.size(config)) {
      throw new Error("Configuration is invalid, it should be a non-empty object");
    }

    if (config.userClaim) {
      config.userClaim = filterClaim(config.userClaim, USER_CLAIMS);
    }

    if (config.accountClaim) {
      config.accountClaim = filterClaim(config.accountClaim, ACCOUNT_CLAIMS);
    }

    if (config.userClaim || config.accountClaim) {
      assertClaimValidity("user", config.userClaim, USER_CLAIMS);
      assertClaimValidity("account", config.accountClaim, ACCOUNT_CLAIMS);

      const accessToken = crypto.lookupToken(config, config.subjectType, {
        user: config.userClaim,
        account: config.accountClaim
      }, config.additionalClaims);
      config = { ...config, accessToken };
    }

    this._state = { ...GLOBALS };

    _.each(REQUIRED_PROPS, (test, prop) => {
      if (!Object.prototype.hasOwnProperty.call(config, prop)) {
        throw new Error(`Configuration is missing required property: ${prop}`);
      }
      if (!test(config[prop])) {
        throw new Error(`${prop} property in Configuration is invalid: ${config[prop]}`);
      }
    });

    _.each(VALID_PROPS, (test, key) => {
      if (config[key]) {
        this._state[key] = config[key];
      }
    });

    // TODO: move to hull-client-node
    if (!this._state.domain && this._state.organization) {
      const [namespace, ...domain] = this._state.organization.split(".");
      this._state.namespace = namespace;
      this._state.domain = domain.join(".");
    }

    this._state.version = pkg.version;
  }

  set(key, value) {
    this._state[key] = value;
  }

  get(key) {
    if (key) {
      return this._state[key];
    }
    return JSON.parse(JSON.stringify(this._state));
  }
}

module.exports = Configuration;
