import jwt from "jwt-simple";
import CacheManager from "cache-manager";
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
  constructor(options) {
    this.cache = CacheManager.caching(options);
    this.middleware = this.middleware.bind(this);
  }

  /**
   * @param {Object} client Hull Client
   */
  middleware(req, res, next) {
    req.hull = req.hull || {};
    req.hull.cache = req.hull.cache || new ShipCache(req.hull, this.cache);
    next();
  }
}
