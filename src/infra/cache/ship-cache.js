/* @flow */
import type { THullReqContext } from "../../types";

const jwt = require("jwt-simple");
const Promise = require("bluebird");

/**
 * Cache available as `req.hull.cache` object. This class is being intiated and added to Context Object by QueueAgent.
 * If you want to customize cache behavior (for example ttl, storage etc.) please @see Infra.QueueAgent
 *
 * @public
 * @name cache
 * @memberof Context
 */
class ConnectorCache {
  ctx: THullReqContext;

  cache: Object;

  promiseReuser: Object;

  constructor(ctx: THullReqContext, cache: Object, promiseReuser: Object) {
    this.ctx = ctx;
    this.cache = cache;
    this.promiseReuser = promiseReuser;
  }

  /**
   * @memberof Context.cache
   * @deprecated
   */
  getShipKey(key: string): string {
    return this.getCacheKey(key);
  }

  /**
   * @memberof Context.cache
   * @param {string} key the ship id
   * @return {string}
   */
  getCacheKey(key: string): string {
    const { secret, organization } = this.ctx.client.configuration();
    return jwt.encode({ sub: key, iss: organization }, secret);
  }

  /**
   * Hull client calls which fetch ship settings could be wrapped with this
   * method to cache the results
   *
   * @public
   * @memberof Context.cache
   * @see https://github.com/BryanDonovan/node-cache-manager#overview
   * @param {string} key
   * @param {Function} cb callback which Promised result would be cached
   * @return {Promise}
   */
  wrap(key: string, cb: Function, options: ?Object): Promise<any> {
    const shipCacheKey = this.getCacheKey(key);
    const reuseWrap = this.promiseReuser.reusePromise((wrappedShipCacheKey) => {
      return this.cache.wrap(wrappedShipCacheKey, cb, options);
    });
    return reuseWrap(shipCacheKey);
  }

  /**
   * Saves ship data to the cache
   * @public
   * @memberof Context.cache
   * @param  {string} key
   * @param  {mixed} value
   * @return {Promise}
   */
  set(key: string, value: any, options: ?Object) {
    const shipCacheKey = this.getCacheKey(key);
    return this.cache.set(shipCacheKey, value, options);
  }

  /**
   * Returns cached information
   * @public
   * @memberof Context.cache
   * @param  {string} key
   * @return {Promise}
   */
  get(key: string) {
    const shipCacheKey = this.getCacheKey(key);
    return this.cache.get(shipCacheKey);
  }

  /**
   * Clears the ship cache. Since Redis stores doesn't return promise
   * for this method, it passes a callback to get a Promise
   * @public
   * @memberof Context.cache
   * @param  {string} key
   * @return Promise
   */
  del(key: string) {
    const shipCacheKey = this.getCacheKey(key);
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

module.exports = ConnectorCache;
