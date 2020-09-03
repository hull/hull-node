const _ = require("lodash");
const bodyParser = require("body-parser");
const Client = require("hull-client");
const Promise = require("bluebird");

const { SmartNotifierResponse, SmartNotifierError } = require("./smart-notifier-response");
const SmartNofifierValidator = require("./smart-notifier-validator");

/**
 * @param  {Object}   options
 * @param  {Object}   [options.skipSignatureValidation=false]
 * @param  {Object}   [options.httpClient=null]
 * @return  {Function} middleware
 */
module.exports = function smartNotifierMiddlewareFactory({ skipSignatureValidation = false, httpClient = null }) {
  return function notifMiddleware(req, res, next) {
    req.hull = req.hull || {};
    const smartNotifierValidator = new SmartNofifierValidator(httpClient);
    smartNotifierValidator.setRequest(req);

    // we are already dealing with SNS based notification
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

    return bodyParser.json({ limit: "20mb" })(req, res, (err) => {
      if (err !== undefined && err.type === "entity.too.large") {
        Client.logger.error("connector.smartNotifierHandler.error", { error: err.toString() });
        return next(new SmartNotifierError("ENTITY_TOO_LARGE", "Payload size bigger than 10mb", err.statusCode, {
          type: "retry",
          size: 1
        }));
      }

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
          if (!req.hull.requestId && req.body.notification_id) {
            const timestamp = Math.floor(new Date().getTime() / 1000);
            req.hull.requestId = ["smart-notifier", timestamp, req.body.notification_id].join(":");
          }

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
