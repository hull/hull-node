import _ from "lodash";
import Configuration from "./configuration";
import restAPI from "./rest-api";
import crypto from "./lib/crypto";
import currentUserMiddleware from "./middleware/current-user";
import trait from "./trait";

const PUBLIC_METHODS = ["get", "post", "del", "put"];

const Client = function Client(config = {}) {
  if (!(this instanceof Client)) { return new Client(config); }

  const clientConfig = new Configuration(config);

  this.configuration = function configuration() {
    return clientConfig.get();
  };

  this.api = function api(url, method, options) {
    return restAPI(clientConfig, url, method, options);
  };
  _.each(PUBLIC_METHODS, (method) => {
    this[method] = (url, options) => {
      return restAPI(clientConfig, url, method, options);
    };
    this.api[method] = (url, options) => {
      return restAPI(clientConfig, url, method, options);
    };
  });

  this.userToken = function userToken(data = clientConfig.get("userId"), claims) {
    return crypto.userToken(clientConfig.get(), data, claims);
  };


  this.currentUserMiddleware = currentUserMiddleware.bind(this, clientConfig.get());

  const shipId = `[${config && config.id}]`;
  const ctxe = _.omit((this.configuration() || {}), ["secret", "accessToken"]);
  this.utils = {
    groupTraits: trait.group,
    log: function log(message, data) {
      Client.log(message, data, ctxe);
    },
    debug: function debug(message, ...data) {
      if (process.env.DEBUG) {
        Client.debug(message, data, ctxe);
      }
    },
    metric: (metric = "", value = "", ctx = {}) => {
      Client.metric(metric, value, {
        ...ctxe,
        ...ctx
      });
    }
  };

  // TODO
  // Check conditions on when to create a "user client" or an "org client".
  // When to pass org scret or not

  if (config.userId || config.accessToken) {
    this.traits = (traits, context = {}) => {
      // Quick and dirty way to add a source prefix to all traits we want in.
      const source = context.source;
      let dest = {};
      if (source) {
        _.reduce(traits, (d, value, key) => {
          const k = `${source}/${key}`;
          d[k] = value;
          return d;
        }, dest);
      } else {
        dest = { ...traits };
      }
      return this.api("me/traits", "put", trait.normalize(dest));
    };

    this.track = (event, properties = {}, context = {}) => {
      return this.api("/t", "POST", {
        ip: null,
        url: null,
        referer: null,
        ...context,
        properties,
        event
      });
    };
  } else {
    this.as = (userId, sudo = false) => {
      // Sudo allows to be a user yet have admin rights... Use with care.
      if (!userId) {
        throw new Error("User Id was not defined when calling hull.as()");
      }
      // const scopedClientConfig = _.omit(config, "secret");
      return new Client({ ...config, userId, sudo });
    };
  }
};

Client.metric = (message, ...args) => {
  console.log(message, JSON.stringify(args));
};

Client.log = (message, data, context = {}) => {
  if (context.shipId) {
    console.log(`[${context.shipId}] ${message}`, JSON.stringify(data));
  } else {
    console.log(message, data);
  }
};

Client.debug = (message, data, context = {}) => {
  if (context.shipId) {
    console.log(`[${context.shipId}] ${message}`, JSON.stringify(data));
  } else {
    console.log(message, data);
  }
};

Client.onMetric = (method) => { Client.metric = method; };
Client.onLog = (method) => { Client.log = method; };
Client.onDebug = (method) => { Client.debug = process.env.DEBUG ? method : function(){}; };

module.exports = Client;
