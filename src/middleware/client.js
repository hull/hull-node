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


module.exports = function hullClientMiddlewareFactory(Client, { hostSecret, fetchShip = true, cacheShip = true }) {
  const _cache = [];

  /* TODO: Expire Cache after x minutes. For now, doesnt expire... Returns a Promise<ship> */
  function getCurrentShip(id, client, bust) {
    client.logger.debug("ship.cache.access", !!_cache[id]);
    if (cacheShip && bust) {
      client.logger.info("ship.cache.bust", !!_cache[id]);
      _cache[id] = null;
    }
    const ship = _cache[id] || client.get(id);
    if (cacheShip && !_cache[id]) {
      client.logger.info("ship.cache.save");
      _cache[id] = ship;
    }
    return ship;
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
        const client = req.hull.client = new Client({ id, secret, organization });
        req.hull.token = jwt.encode(config, hostSecret);
        if (fetchShip) {

          const bust = (message && message.Subject === "ship:update");
          // Promise<ship>
          return getCurrentShip(id, client, bust).then((ship = {}) => {
            req.hull.ship = ship;
            return next();
          }, (err) => {
            const e = new Error(err.message);
            e.status = 401;
            return next(e);
          });
        }

        return next();
      }
      const e = new Error("Missing Credentials");
      e.status = 400;
      return next(e);
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
