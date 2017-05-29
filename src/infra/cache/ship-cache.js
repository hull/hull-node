import jwt from "jwt-simple";
import Promise from "bluebird";

export default class ShipCache {

  /**
   * @param {Object} options passed to node-cache-manager
   */
  constructor(ctx, cache) {
    this.ctx = ctx;
    this.cache = cache;
  }

  /**
   * @param {String} id the ship id
   * @return {String}
   */
  getShipKey(id) {
    const { secret, organization } = this.ctx.client.configuration();
    return jwt.encode({ sub: id, iss: organization }, secret);
  }

  /**
   * Hull client calls which fetch ship settings could be wrapped with this
   * method to cache the results
   * @see https://github.com/BryanDonovan/node-cache-manager#overview
   * @param {String} id
   * @param {Function} cb callback which Promised result would be cached
   * @return {Promise}
   */
  wrap(id, cb) {
    const shipCacheKey = this.getShipKey(id);
    return this.cache.wrap(shipCacheKey, cb);
  }

  /**
   * Saves ship data to the cache
   * @param  {String} id ship id
   * @param  {Object} ship
   * @return {Promise}
   */
  set(id, ship) {
    const shipCacheKey = this.getShipKey(id);
    return this.cache.set(shipCacheKey, ship);
  }

  /**
   * Clears the ship cache. Since Redis stores doesn't return promise
   * for this method, it passes a callback to get a Promise
   * @param  {String} id
   * @return Promise
   */
  del(id) {
    const shipCacheKey = this.getShipKey(id);
    return new Promise((resolve, reject) => {
      this.cache.del(shipCacheKey, (error) => {
        if (error) {
          return reject(error);
        }
        return resolve();
      });
    });
  }
}
