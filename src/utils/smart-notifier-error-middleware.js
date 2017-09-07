import {
  SmartNotifierResponse,
  SmartNotifierError
} from "./smart-notifier-response";

/**
 * Error handlers that returns SmartNotifierError objects to json
 *
 * @param  {Object}   req
 * @param  {Object}   res
 * @param  {Function} next
 */
export default function smartNotifierErrorMiddlewareFactory() {
  return function handleError(err, req, res, next) { // eslint-disable-line no-unused-vars
    // only handle SmartNotifierResponse object
    if (err instanceof SmartNotifierError) {
      const response = new SmartNotifierResponse();
      response.setFlowControl(err.flowControl);
      response.addError(err);
      res.status(400).json(response.toJSON());
    } else {
      res.status(500).json({
        error: err.message
      });
    }
  };
}
