const cacheManager = require("cache-manager");
const _ = require("lodash");
const ShipCache = require("./ship-cache");
const PromiseReuser = require("../../utils/promise-reuser");

/**
 * This is a wrapper over https://github.com/BryanDonovan/node-cache-manager
 * to manage ship cache storage.
 * It is responsible for handling cache key for every ship.
 */
class Cache {

  /**
   * @param {Object} options passed to node-cache-manager
   */
  constructor(options = {}) {
    _.defaults(options, {
      ttl: 60, /* seconds */
      max: 100, /* items */
      store: "memory"
    });
    this.cache = cacheManager.caching(options);
    this.contextMiddleware = this.contextMiddleware.bind(this);
    this.promiseReuser = new PromiseReuser();
  }

  /**
   * @param {Object} client Hull Client
   */
  contextMiddleware() { // eslint-disable-line class-methods-use-this
    return (req, res, next) => {
      req.hull = req.hull || {};
      req.hull.cache = req.hull.cache || new ShipCache(req.hull, this.cache, this.promiseReuser);
      next();
    };
  }
}

module.exports = Cache;
