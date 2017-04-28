import _ from "lodash";
import winston from "winston";
import Configuration from "./configuration";
import restAPI from "./rest-api";
import crypto from "./lib/crypto";
import currentUserMiddleware from "./middleware/current-user";
import trait from "./trait";
import * as extract from "./extract";
import * as settings from "./settings";
import * as propertiesUtils from "./properties";
import FirehoseBatcher from "./firehose-batcher";

const PUBLIC_METHODS = ["get", "post", "del", "put"];

const logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      level: "info",
      json: true,
      stringify: true
    })
  ]
});


const Client = function Client(config = {}) {
  if (!(this instanceof Client)) { return new Client(config); }

  const clientConfig = new Configuration(config);

  this.configuration = function configuration() {
    return clientConfig.get();
  };

  const batch = FirehoseBatcher.getInstance(clientConfig.get(), (params, batcher) => {
    return restAPI(batcher.config, "firehose", "post", params);
  });

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
    return crypto.lookupToken(clientConfig.get(), "user", data, claims);
  };

  this.currentUserMiddleware = currentUserMiddleware.bind(this, clientConfig.get());

  this.utils = {
    groupTraits: trait.group,
    properties: {
      get: propertiesUtils.get.bind(this),
    },
    settings: {
      update: settings.update.bind(this),
    },
    extract: {
      request: extract.request.bind(this),
      handle: extract.handle.bind(this),
    }
  };

  const ctxe = _.mapKeys(
    _.pick((this.configuration() || {}), ["organization", "id", "connectorName"]),
    (value, key) => _.snakeCase(key)
  );
  const logFactory = level => (message, data) => logger[level](message, { context: ctxe, data });
  const logs = {};
  ["silly", "debug", "verbose", "info", "warn", "error"].map((level) => { logs[level] = logFactory(level); return level; });


  this.logger = {
    log: logFactory("info"),
    ...logs
  };

  // TODO
  // Check conditions on when to create a "user client" or an "org client".
  // When to pass org scret or not

  if (config.userClaim || config.accountClaim || config.accessToken) {
    this.traits = (traits, context = {}) => {
      // Quick and dirty way to add a source prefix to all traits we want in.
      const source = context.source;
      let body = {};
      if (source) {
        _.reduce(traits, (d, value, key) => {
          const k = `${source}/${key}`;
          d[k] = value;
          return d;
        }, body);
      } else {
        body = { ...traits };
      }

      if (context.sync === true) {
        return this.post("me/traits", body);
      }

      return batch({ type: "traits", body });
    };

    this.track = (event, properties = {}, context = {}) => {
      return batch({
        type: "track",
        body: {
          ip: null,
          url: null,
          referer: null,
          ...context,
          properties,
          event
        }
      });
    };

    if (config.userClaim) {
      this.account = (accountClaim = {}) => {
        if (!accountClaim) {
          return new Client({ ...config, subjectType: "account" });
        }
        return new Client({ ...config, subjectType: "account", accountClaim });
      };
    }
  } else {
    this.asUser = (userClaim, additionalClaims = {}) => {
      if (!userClaim) {
        throw new Error("User Claims was not defined when calling hull.asUser()");
      }
      return new Client({ ...config, subjectType: "user", userClaim, additionalClaims });
    };

    this.asAccount = (accountClaim, additionalClaims = {}) => {
      if (!accountClaim) {
        throw new Error("Account Claims was not defined when calling hull.asAccount()");
      }
      return new Client({ ...config, subjectType: "account", accountClaim, additionalClaims });
    };
  }
};

Client.logger = logger;

module.exports = Client;
