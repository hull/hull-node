const _ = require("lodash");

/**
 * @example
 * app.get("/", (req, res, next) => {
 *   promiseBasedFn.then(next, next);
 * }, responseMiddleware())
 */
module.exports = function responseMiddlewareFactory() {
  return function responseMiddleware(result, req, res, next) {
    if (_.isError(result)) {
      const errorData = {
        error: (result.stack || result),
        req: _.pick(req, "url", "method", "message")
      };
      try {
        req.hull.client.logger.error("connector.action.error", errorData);
      } catch (e) {
        console.error("action.error", errorData);
      }
      res.status(500);
    } else {
      res.status(200);
    }
    if (_.isError(result)) {
      result = result.message || result;
    } else {
      result = (_.isString(result)) ? result : "ok";
    }

    res.end(result);
    next();
  };
};
