import SmartNotifierResponse from "./smart-notifier-response";
import {
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
  return function handleError(err, req, res, next) {
    // onyl handle SmartNotifierResponse object
    if (err.isSmartNotifierError) {
      let response = new SmartNotifierResponse();
      response.setFlowControl(err.flowControl);
      response.addError(err);
      res.status(400).json(response);
    } else {
      res.status(500).json({
        error: err.message
      });
    }
  }
}
