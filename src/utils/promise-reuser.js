// @flow

/**
 * Object which allows to reuse pending promises with the same
 * arguments passed to original function
 * Based on https://github.com/elado/reuse-promise
 */
export default class PromiseReuser {
  options: Object
  promiseMapsByArgs: Object

  constructor(options: Object = {}) {
    /**
     * default serializing strategy
     */
    function serializeArguments(key) {
      return JSON.stringify(key);
    }

    this.options = {
      serializeArguments,
      ...options
    };
    this.promiseMapsByArgs = {};
  }

  reusePromise(origFn: Function) {
    const self = this;
    function reusePromiseWrappedFn(...args: Array<any>) {
      const key = self.options.serializeArguments(args);

      const pendingPromise = self.promiseMapsByArgs[key];

      if (pendingPromise) {
        return pendingPromise;
      }

      const forgetPromise = () => delete self.promiseMapsByArgs[key];

      const origPromise = origFn.apply(this, args);
      const promise = origPromise.then((value) => {
        forgetPromise();
        return value;
      }, (err) => {
        forgetPromise();
        throw err;
      });
      self.promiseMapsByArgs[key] = promise;

      return promise;
    }

    return reusePromiseWrappedFn;
  }
}
