const TransientError = require("../errors/transient-error");

// flaky connection error codes
const ERROR_CODES = [
  "ECONNRESET",
  "ETIMEDOUT",
  "EADDRINFO",
  "ESOCKETTIMEDOUT",
  "ECONNABORTED",
];

/**
 * This is a general error handling SuperAgent plugin.
 *
 * It changes default superagent retry strategy to rerun the query only on transient
 * connectivity issues (`ECONNRESET`, `ETIMEDOUT`, `EADDRINFO`, `ESOCKETTIMEDOUT`, `ECONNABORTED`).
 * So any of those errors will be retried according to retries option (defaults to 2).
 *
 * If the retry fails again due to any of those errors the SuperAgent Promise will
 * be rejected with special error class TransientError to distinguish between logical errors
 * and flaky connection issues.
 *
 * In case of any other request the plugin applies simple error handling strategy:
 * every non 2xx or 3xx response is treated as an error and the promise will be rejected.
 * Every connector ServiceClient should apply it's own error handling strategy by overriding `ok` handler.
 *
 * @public
 * @name superagentErrorPlugin
 * @memberof Utils
 * @param  {Object} [options={}]
 * @param  {Number} [options.retries] Number of retries
 * @param  {Number} [options.timeout] Timeout for request
 * @return {Function} function to use as superagent plugin
 * @example
 * superagent.get("http://test/test")
 *   .use(superagentErrorPlugin())
 *   .ok((res) => {
 *     if (res.status === 401) {
 *       throw new ConfigurationError();
 *     }
 *     if (res.status === 429) {
 *       throw new RateLimitError();
 *     }
 *     return true;
 *   })
 *   .catch((error) => {
 *     // error.constructor.name can be ConfigurationError, RateLimitError coming from `ok` handler above
 *     // or TransientError coming from logic applied by `superagentErrorPlugin`
 *   })
 */
function superagentErrorPluginFactory({ retries = 2, timeout = 10000 } = {}) {
  return function superagentErrorPlugin(request) {
    const end = request.end;

    // for all network connection issues we return TransientError
    request.end = cb => {
      end.call(request, (err, res) => {
        let newError = err;
        // if we are having an error which is either a flaky connection issue
        // or an timeout, then we return a TransientError
        if (
          (err && err.code && ERROR_CODES.indexOf(err.code) !== -1) ||
          (err && err.timeout)
        ) {
          newError = new TransientError(err.message);
          newError.code = err.code;
          newError.response = err.response;
          newError.retries = err.retries;
          newError.stack = err.stack;
        }
        cb(newError, res);
      });
    };

    // this retrial handler will only retry when we have a network connection issue
    request.retry(retries, err => {
      if (err && err.code && ERROR_CODES.indexOf(err.code) !== -1) {
        return true;
      }
      return false;
    });

    // by default we reject all non 2xx
    request.ok(res => res.status < 400);
    request.timeout(timeout);
    return request;
  };
}

module.exports = superagentErrorPluginFactory;
