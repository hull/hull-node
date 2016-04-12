const _cache = {};

function incomingMiddleware({ Hull, useCache, fetchShip }) {
  function getShip(shipId, client, forceUpdate) {
    if (useCache) {
      if (forceUpdate) _cache[shipId] = null;
      _cache[shipId] = _cache[shipId] || client.get(shipId);
      return _cache[shipId];
    }
    return client.get(shipId);
  }

  function parseQueryString(query) {
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

    function done() {
      req.hull.timings.fetchShip = new Date() - startAt;
      next();
    }

    //Retreive current Ship info from Querystring.
    const { organization, ship, secret } = parseQueryString(req.query);

    // When receiving from SNS, this will be populated by 'notif-handler'
    const { message } = req.hull;
    let forceShipUpdate = !!(message && message.Subject === 'ship:update');

    if (organization && ship && secret) {

      //Create a Hull client with the current ship config.
      const client = req.hull.client = new Hull({
        id: ship,
        organization: organization,
        secret: secret
      });

      //If we need to fetch it, go ahead.
      if (fetchShip) {
        getShip(ship, client, forceShipUpdate).then((ship) => {
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

export default function(Hull, req, res, next){
  req.hull = req.hull || { timings: {} };

  if (req.body.ship && req.body.ship.private_settings) {
    req.hull.ship = req.body.ship;
  }

  return incomingMiddleware({ Hull, useCache: true, fetchShip: !req.hull.ship })(req, res, next);
}
