const util = require("util");
const {
  SmartNotifierResponse,
  SmartNotifierError
} = require("./smart-notifier-response");

/**
 * Error handlers that returns SmartNotifierError objects to json
 *
 * @param  {Object}   req
 * @param  {Object}   res
 * @param  {Function} next
 */
module.exports = util.deprecate(function smartNotifierErrorMiddlewareFactory() {
  return function handleError(err, req, res, next) { // eslint-disable-line no-unused-vars
    // only handle SmartNotifierResponse object
    if (err instanceof SmartNotifierError) {
      const statusCode = err.statusCode || 400;
      const response = new SmartNotifierResponse();
      response.setFlowControl(err.flowControl);
      response.addError(err);
      return res.status(statusCode).json(response.toJSON());
    }
    return next(err);
  };
}, "smartNotifierErrorMiddleware is deprecated");
