import cacheManager from "cache-manager";
import _ from "lodash";
import ShipCache from "./ship-cache";

/**
 * This is a wrapper over https://github.com/BryanDonovan/node-cache-manager
 * to manage ship cache storage.
 * It is responsible for handling cache key for every ship.
 */
export default class Cache {

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
  }

  /**
   * @param {Object} client Hull Client
   */
  contextMiddleware() { // eslint-disable-line class-methods-use-this
    return (req, res, next) => {
      req.hull = req.hull || {};
      req.hull.cache = req.hull.cache || new ShipCache(req.hull, this.cache);
      next();
    };
  }
}
