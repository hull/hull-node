import _ from "lodash";
import jwt from "jwt-simple";

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


module.exports = function hullClientMiddlewareFactory(Client, { hostSecret, clientConfig = {} }) {
  function getCurrentShip(id, client, cache, bust) {
    return (() => {
      if (cache && bust) {
        return cache.del(id);
      }
      return Promise.resolve();
    })()
    .then(() => {
      if (cache) {
        return cache.wrap(id, () => {
          return client.get(id);
        });
      }
      return client.get(id);
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
      const { message, config } = req.hull;
      const { organization, ship: id, secret } = config;
      if (organization && id && secret) {
        req.hull.client = new Client(_.merge({ id, secret, organization }, clientConfig));

        req.hull.token = jwt.encode(config, hostSecret);

        const bust = (message && message.Subject === "ship:update");
        // Promise<ship>
        return getCurrentShip(id, req.hull.client, req.hull.cache, bust).then((ship = {}) => {
          req.hull.ship = ship;
          req.hull.hostname = req.hostname;
          req.hull.options = _.merge(req.query, req.body);
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
