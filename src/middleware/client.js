const _ = require("lodash");
const jwt = require("jwt-simple");

const { handleExtract, requestExtract } = require("../helpers");

function parseQueryString(query) {
  return ["organization", "ship", "secret"].reduce((cfg, k) => {
    const val = (query[k] || "").trim();
    if (typeof val === "string") {
      cfg[k] = val;
    } else if (val && val[0] && typeof val[0] === "string") {
      cfg[k] = val[0].trim();
    }
    return cfg;
  }, {});
}

function parseToken(token, secret) {
  if (!token || !secret) { return false; }
  try {
    const config = jwt.decode(token, secret);
    return config;
  } catch (err) {
    const e = new Error("Invalid Token");
    e.status = 401;
    throw e;
  }
}

/**
 * This middleware standardizes the instantiation of a [Hull Client](https://github.com/hull/hull-client-node) in the context of authorized HTTP request. It also fetches the entire ship's configuration.
 * @function Hull.Middleware
 * @public
 * @param  {HullClient} HullClient                Hull Client - the version exposed by this library comes with HullClient argument bound
 * @param  {Object}     options
 * @param  {string}     options.hostSecret        The ship hosted secret - consider this as a private key which is used to encrypt and decrypt `req.hull.token`. The token is useful for exposing it outside the Connector <-> Hull Platform communication. For example the OAuth flow or webhooks. Thanks to the encryption no 3rd party will get access to Hull Platform credentials.
 * @param  {Object}     [options.clientConfig={}] Additional config which will be passed to the new instance of Hull Client
 * @return {Function}
 */
module.exports = function hullClientMiddlewareFactory(HullClient, { hostSecret, clientConfig = {} }) {
  function getCurrentShip(id, client, cache, bust, notification) {
    if (notification && notification.connector) {
      return Promise.resolve(notification.connector);
    }

    return (() => {
      if (cache && bust) {
        return cache.del(id);
      }
      return Promise.resolve();
    })()
    .then(() => {
      if (cache) {
        return cache.wrap(id, () => {
          return client.get(id, {}, {
            timeout: 5000,
            retry: 1000
          });
        });
      }
      return client.get(id, {}, {
        timeout: 5000,
        retry: 1000
      });
    });
  }

  return function hullClientMiddleware(req, res, next) {
    req.hull = req.hull || {};

    try {
      // Try to fetch config, or create it based on query string parameters or Token
      req.hull.config =
        req.hull.config ||
        parseToken(req.hull.token, hostSecret) ||
        parseQueryString(req.query) ||
        {};
      const { message, notification, config } = req.hull;
      const { organization, ship: id, secret } = config;

      const headers = req.headers || {};
      const requestId = req.hull.requestId || headers["x-hull-request-id"];

      if (organization && id && secret) {
        req.hull.client = new HullClient(_.merge({ id, secret, organization, requestId }, clientConfig));
        req.hull.client.utils = req.hull.client.utils || {};
        req.hull.client.utils.extract = {
          handle: (options) => {
            return handleExtract(req.hull, options);
          },
          request: (options) => {
            return requestExtract(req.hull, options);
          }
        };

        req.hull.token = jwt.encode(config, hostSecret);

        const bust = (message && message.Subject === "ship:update");

        // Promise<ship>
        return getCurrentShip(id, req.hull.client, req.hull.cache, bust, notification).then((ship = {}) => {
          req.hull.ship = ship;
          req.hull.connector = ship;
          req.hull.hostname = req.hostname;
          req.hull.options = _.merge({}, req.query, req.body);
          return next();
        }, (err) => {
          const e = new Error(err.message);
          e.status = 401;
          return next(e);
        });
      }
      return next();
    } catch (err) {
      try {
        err.status = 401;
        return next(err);
      } catch (err2) {
        // Fallback the fallback
        console.warn("Unknown Error:", err2);
      }
    }
    return next();
  };
};
