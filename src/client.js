'use strict';

import _ from 'lodash';
import Configuration from './configuration';
import restAPI from './rest-api';
import crypto from './crypto';
import currentUserMiddleware from './current-user';
import webhookMiddleware from './webhook';
import trait from './trait';

const PUBLIC_METHODS = ['get', 'post', 'del', 'put'];

module.exports = function Client(config = {}) {
  if (!(this instanceof Client)) { return new Client(config); }

  var clientConfig = new Configuration(config);

  this.configuration = function configuration() {
    return clientConfig.get();
  };

  this.api = function api(url, method, options) {
    return restAPI(clientConfig, url, method, options);
  };
  _.each(PUBLIC_METHODS, (method)=>{
    this[method] = (url, options)=>{
      return restAPI(clientConfig, url, method, options);
    };
    this.api[method] = (url, options)=>{
      return restAPI(clientConfig, url, method, options);
    };
  });

  this.userToken = function(data = clientConfig.get('userId'), claims) {
    return crypto.userToken(clientConfig.get(), data, claims);
  };

  this.currentUserMiddleware = function(req, res, next) {
    return currentUserMiddleware(clientConfig.get(), req, res, next);
  };

  this.webhookMiddleware = function(req, res, next) {
    return webhookMiddleware(clientConfig, req, res, next);
  };

  const shipId = `[${config && config.id}]`;
  var log = console.log.bind(undefined, shipId);
  this.utils = {
    groupTraits: trait.group,
    log: function(){
      return log.apply(undefined, arguments)
    }
  };

  // TODO
  // Check conditions on when to create a "user client" or an "org client".
  // When to pass org scret or not

  if (config.userId || config.accessToken) {
    this.traits = function(traits, context = {}) {
      // Quick and dirty way to add a source prefix to all traits we want in.
      const source = context.source;
      let dest = {};
      if (source) {
        _.reduce(traits, (d, value, key)=>{
          const k = `${source}/${key}`;
          d[k] = value;
          return d;
        }, dest);
      } else {
        dest = {...traits};
      }
      return this.api('me/traits', 'put', trait.normalize(dest));
    };

    this.track = function(event, properties = {}, context = {}) {
      return this.api('/t', 'POST', {
        ip: null,
        url: null,
        referer: null,
        ...context,
        properties,
        event
      });
    };
  } else {
    this.as = function(userId, sudo = false) {
      // Sudo allows to be a user yet have admin rights... Use with care.
      if (!userId) {
        throw new Error('User Id was not defined when calling hull.as()');
      }
      // const scopedClientConfig = _.omit(config, 'secret');
      return new Client({ ...config, userId, sudo });
    };
  }
};
