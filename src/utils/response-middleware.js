import _ from "lodash";

/**
 * @param  {Object}   req
 * @param  {Object}   res
 * @param  {Function} next
 */
export default function segmentsMiddleware(result, req, res, next) {
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
  result = (_.isString(result)) ? result : "ok";
  res.end(result);
  next();
}
