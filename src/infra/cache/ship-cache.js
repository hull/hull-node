// @flow
import jwt from "jwt-simple";
import Promise from "bluebird";

import { HullReqContextType } from "../../types";

export default class ConnectorCache {
  ctx: HullReqContextType;
  cache: Object;
  promiseReuser: Object;

  /**
   * @param {Object} options passed to node-cache-manager
   */
  constructor(ctx: HullReqContextType, cache: Object, promiseReuser: Object) {
    this.ctx = ctx;
    this.cache = cache;
    this.promiseReuser = promiseReuser;
  }

  /**
   * @deprecated
   */
  getShipKey(key: string): string {
    return this.getCacheKey(key);
  }

  /**
   * @param {String} id the ship id
   * @return {String}
   */
  getCacheKey(key: string): string {
    const { secret, organization } = this.ctx.client.configuration();
    return jwt.encode({ sub: key, iss: organization }, secret);
  }

  /**
   * Hull client calls which fetch ship settings could be wrapped with this
   * method to cache the results
   * @see https://github.com/BryanDonovan/node-cache-manager#overview
   * @param {String} id
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
   * @param  {String} id ship id
   * @param  {Object} ship
   * @return {Promise}
   */
  set(key: string, value: any, options: ?Object) {
    const shipCacheKey = this.getCacheKey(key);
    return this.cache.set(shipCacheKey, value, options);
  }

  /**
   * Returns cached information
   * @param  {String} id
   * @return {Promise}
   */
  get(key: string) {
    const shipCacheKey = this.getCacheKey(key);
    return this.cache.get(shipCacheKey);
  }

  /**
   * Clears the ship cache. Since Redis stores doesn't return promise
   * for this method, it passes a callback to get a Promise
   * @param  {String} id
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
