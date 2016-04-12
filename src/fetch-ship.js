const _cache = {};
function fetchShip(Client, options) {
  function getCurrentShip(shipId, client, forceUpdate) {
    if (options.useCache) {
      if (forceUpdate) _cache[shipId] = null;
      _cache[shipId] = _cache[shipId] || client.get(shipId);
      return _cache[shipId];
    }
    return client.get(shipId);
  }

  function parseConfig(query) {
    return ['organization', 'ship', 'secret'].reduce((cfg, k)=> {
      const val = query[k];
      if (typeof val === 'string') {
        cfg[k] = val;
      } else if (val && val.length) {
        cfg[k] = val[0];
      }

      if (typeof cfg[k] === 'string') {
        cfg[k] = cfg[k].trim();
      }

      return cfg;
    }, {});
  }

  return function(req, res, next) {
    const startAt = new Date();
    req.hull = req.hull || { timings: {} };
    req.hull.timings = req.hull.timings || {};

    const config = parseConfig(req.query);

    const { message } = req.hull;
    let forceShipUpdate = false;
    if (message && message.Subject === 'ship:update') {
      forceShipUpdate = true;
    }

    function done() {
      req.hull.timings.fetchShip = new Date() - startAt;
      next();
    }

    if (config.organization && config.ship && config.secret) {
      const client = req.hull.client = new Client({
        id: config.ship,
        organization: config.organization,
        secret: config.secret
      });

      if (options.fetchShip) {
        getCurrentShip(config.ship, client, forceShipUpdate).then((ship) => {
          req.hull.ship = ship;
          done();
        }, (err) => {
          res.status(404);
          res.status({ reason: 'ship_not_found', message: 'Ship not found' });
          res.end('Error:' + err.toString());
        });
      } else {
        done();
      }
    } else {
      res.status(401);
      res.send({ reason: 'hull_auth', message: 'Missing Hull credentials' });
      res.end();
    }
  };
}

export default {
  fetchShip,
  fetchShipMiddleware(Client, req, res, next) {
    req.hull = req.hull || { timings: {} };

    if (req.body.ship && req.body.ship.private_settings) {
      req.hull.ship = req.body.ship;
    }

    return middleware(Client, {
      useCache: true,
      fetchShip: !req.hull.ship
    })(req, res, next);
  }
}

export default function
