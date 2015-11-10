'use strict';

import _ from 'lodash';
// import { EventEmitter } from 'events';
import Configuration from './configuration';
import restAPI from './rest-api';
import crypto from './crypto';
import currentUserMiddleware from './current-user';
import webhookMiddleware from './webhook';
import trait from './trait';

const PUBLIC_METHODS = ['get', 'post', 'del', 'put'];

var Client = function(config = {}) {
  var configuration

  if (!(this instanceof Client)) { return new Client(config); }

  configuration = new Configuration(config);

  this.configuration = function configuration() {
    console.log(configuration.get())
    return configuration.get();
  }

  this.api = function api(url, method, options) {
    return restAPI(_configuration, url, method, options);
  }

  this.userToken = function(data, claims) {
    return crypto.userToken(_configuration, data, claims);
  },

  this.currentUserMiddleware = function(req, res, next) {
    return currentUserMiddleware(_configuration, req, res, next);
  },

  this.webhookMiddleware = function(req, res, next) {
    return webhookMiddleware(_configuration, req, res, next);
  }

  _.each(PUBLIC_METHODS, (method)=>{
    this[method] = (url, options)=>{
      return this.api(url, method, options);
    };
  });

  if (config.userId || config.accessToken) {
    this.traits = function(traits) {
      return this.api('me/traits', 'put', trait.normalize(traits));
    }
  } else {
    this.as = function(userId) {
      if (!userId) {
        throw new Error('User Id was not defined when calling hull.as()');
      }
      return new Client({ ...config, userId });
    }
  }
};

export default Client;
