import _ from "lodash";
import pkg from "../package.json";
import crypto from "./lib/crypto";

const GLOBALS = {
  prefix: "/api/v1",
  domain: "hullapp.io",
  protocol: "https"
};

const VALID_OBJECT_ID = new RegExp("^[0-9a-fA-F]{24}$");
const VALID = {
  boolean(val) {
    return (val === true || val === false);
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
  protocol: VALID.string,
  userId: VALID.string,
  accessToken: VALID.string,
  hostSecret: VALID.string,
  flushAt: VALID.number,
  flushAfter: VALID.number
};

class Configuration {

  constructor(config) {
    if (!_.isObject(config) || !_.size(config)) {
      throw new Error("Configuration is invalid, it should be a non-empty object");
    }

    if (config.userId) {
      const accessToken = crypto.lookupToken(config, config.userId);
      config = { ...config, accessToken };
    }

    this._state = { ...GLOBALS };

    _.each(REQUIRED_PROPS, (test, prop) => {
      if (!config.hasOwnProperty(prop)) {
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
