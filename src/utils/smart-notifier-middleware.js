import _ from "lodash";
import bodyParser from "body-parser";
import Client from "hull-client";
import Promise from "bluebird";

import SmartNotifierResponse from "./smart-notifier-response";
import SmartNofifierValidator from "./smart-notifier-validator";

/**
 * @param  {Object}   req
 * @param  {Object}   res
 * @param  {Function} next
 */
export default function smartNotifierMiddlewareFactory({ skipSignatureValidation = false }) {
  const smartNotifierValidator = new SmartNofifierValidator();

  return function notifMiddleware(req, res, next) {
    req.hull = req.hull || {};

    smartNotifierValidator.setRequest(req);

    if (!smartNotifierValidator.hasFlagHeader()) {
      return next();
    }

    return bodyParser.json({ limit: "10mb" })(req, res, () => {
      Client.logger.debug("connector.smartNotifierHandler", _.pick(req.body, "channel", "notification_id"));

      if (!smartNotifierValidator.validatePayload()) {
        Client.logger.error("connector.smartNotifierHandler.error", { error: "No notification payload" });
        return res.status(400).end("Bad request");
      }

      if (!smartNotifierValidator.validateConfiguration()) {
        Client.logger.error("connector.smartNotifierHandler.error", { error: "No configuration object" });
        return res.status(400).end("Bad request");
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
        }, () => {
          Client.logger.error("connector.smartNotifierHandler.error", { error: "No valid signature" });
          return res.status(400).end("Bad request");
        });
    });
  };
}
