'use strict';

import _ from 'lodash';
import pkg from '../package.json';
import crypto from './crypto';

const GLOBALS = {
  prefix: '/api/v1',
  domain: 'hullapp.io',
  protocol: 'https'
};

const VALID_OBJECT_ID = new RegExp('^[0-9a-fA-F]{24}$');
const VALID = {
  objectId(str) {
    return VALID_OBJECT_ID.test(str);
  },
  string(str) {
    return _.isString(str) && str.length > 0;
  }
};

const REQUIRED_PROPS = {
  platformId: VALID.objectId,
  platformSecret: VALID.string,
  orgUrl: VALID.string
};

const VALID_PROPS = {
  ...REQUIRED_PROPS,
  userId: VALID.objectId,
  accessToken: VALID.string
};

class Configuration {

  constructor(config) {
    if (!_.isObject(config) || !_.size(config)) {
      throw new Error('Configuration is invalid, it should be a non-empty object');
    }

    if (config.userId) {
      const accessToken = crypto.userToken(config, config.userId);
      config = { ...config, accessToken };
    }

    this._state = {...GLOBALS};

    _.each(REQUIRED_PROPS, (test, prop)=>{
      if (!config.hasOwnProperty(prop)) {
        throw new Error('Configuration is missing required property: ' + prop);
      }
      if (!test(config[prop])) {
        throw new Error(prop + ' property in Configuration is invalid: ' + config[prop]);
      }
    });

    _.each(VALID_PROPS, (test, key)=>{
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

export default Configuration;
