const _ = require("lodash");
const bodyParser = require("body-parser");
const Client = require("hull-client");
const Promise = require("bluebird");

const { SmartNotifierResponse, SmartNotifierError } = require("./smart-notifier-response");
const SmartNofifierValidator = require("./smart-notifier-validator");

/**
 * @param  {Object}   req
 * @param  {Object}   res
 * @param  {Function} next
 */
module.exports = function smartNotifierMiddlewareFactory({ skipSignatureValidation = false, httpClient = null }) {
  return function notifMiddleware(req, res, next) {
    req.hull = req.hull || {};
    const smartNotifierValidator = new SmartNofifierValidator(httpClient);
    smartNotifierValidator.setRequest(req);

    if (req.hull.notification) {
      return next();
    }

    if (!smartNotifierValidator.hasFlagHeader()) {
      return next();
    }

    if (!skipSignatureValidation) {
      if (!smartNotifierValidator.validateSignatureVersion()) {
        return next(new SmartNotifierError("UNSUPPORTED_SIGNATURE_VERSION", "Unsupported signature version"));
      }

      if (!smartNotifierValidator.validateSignatureHeaders()) {
        return next(new SmartNotifierError("MISSING_SIGNATURE_HEADERS", "Missing signature header(s)"));
      }
    }

    return bodyParser.json({ limit: "10mb" })(req, res, () => {
      Client.logger.debug("connector.smartNotifierHandler", _.pick(req.body, "channel", "notification_id"));

      if (!smartNotifierValidator.validatePayload()) {
        Client.logger.error("connector.smartNotifierHandler.error", { error: "No notification payload" });
        return next(new SmartNotifierError("MISSING_NOTIFICATION", "No notification in payload"));
      }

      if (!smartNotifierValidator.validateConfiguration()) {
        Client.logger.error("connector.smartNotifierHandler.error", { error: "No configuration object" });
        return next(new SmartNotifierError("MISSING_CONFIGURATION", "No configuration in payload"));
      }

      return (() => {
        if (skipSignatureValidation === true) {
          return Promise.resolve();
        }
        return smartNotifierValidator.validateSignature();
      })()
        .then(() => {
          req.hull.notification = req.body;
          req.hull.config = req.hull.notification.configuration;
          // FIXME: we need to do that mapping since the middleware is expecting
          // `ship` param instead of `id`
          req.hull.config.ship = _.get(req, "hull.notification.configuration.id");
          req.hull.smartNotifierResponse = new SmartNotifierResponse();
          return next();
        }, (error) => {
          Client.logger.error("connector.smartNotifierHandler.error", { error: "No valid signature", error_message: error.message || error });
          return next(new SmartNotifierError("INVALID_SIGNATURE", "Invalid signature"));
        });
    });
  };
};
