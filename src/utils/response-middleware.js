import _ from "lodash";

/**
 * @example
 * app.get("/", (req, res, next) => {
 *   promiseBasedFn.then(next, next);
 * }, responseMiddleware())
 */
export default function responseMiddlewareFactory() {
  return function responseMiddleware(result, req, res, next) {
    if (_.isError(result)) {
      try {
        req.hull.client.logger.error("action.error", result.stack || result);
      } catch (e) {
        console.error("action.error", result.stack || result);
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
}
