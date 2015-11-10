'use strict';

import _ from 'lodash';
import Configuration from './configuration';
import restAPI from './rest-api';
import crypto from './crypto';
import currentUserMiddleware from './current-user';
import webhookMiddleware from './webhook';
import trait from './trait';

const PUBLIC_METHODS = ['get', 'post', 'del', 'put'];

var Client = function(config = {}) {
  if (!(this instanceof Client)) { return new Client(config); }

  var clientConfig = new Configuration(config);

  this.configuration = function configuration() {
    return clientConfig.get();
  };

  this.api = function api(url, method, options) {
    return restAPI(clientConfig, url, method, options);
  };

  this.userToken = function(data, claims) {
    return crypto.userToken(clientConfig, data, claims);
  };

  this.currentUserMiddleware = function(req, res, next) {
    return currentUserMiddleware(clientConfig, req, res, next);
  };

  this.webhookMiddleware = function(req, res, next) {
    return webhookMiddleware(clientConfig, req, res, next);
  };

  _.each(PUBLIC_METHODS, (method)=>{
    this[method] = (url, options)=>{
      return this.api(url, method, options);
    };
  });

  // TODO
  // Check conditions on when to create a "user client" or an "org client".
  // When to pass org scret or not

  if (config.userId || config.accessToken) {
    this.traits = function(traits) {
      return this.api('me/traits', 'put', trait.normalize(traits));
    };
  } else {
    this.as = function(userId) {
      if (!userId) {
        throw new Error('User Id was not defined when calling hull.as()');
      }
      return new Client({ ...config, userId });
    };
  }
};

export default Client;
