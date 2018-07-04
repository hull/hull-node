// @flow
import type { $Response, NextFunction } from "express";
import type { HullRequestBase } from "../types";

const debug = require("debug")("hull-connector:credentials-from-notification");
const bodyParser = require("body-parser");
const NotificationValidator = require("../utils/notification-validator");

/**
 * This middleware is responsible for parsing incoming notification, validating it
 * and extracting configuration out of it.
 * As a result it sets `req.hull.clientConfig` and `req.hull.notification`.
 */
function credentialsFromNotificationMiddlewareFactory() {
  return function credentialsFromNotificationMiddleware(req: HullRequestBase, res: $Response, next: NextFunction) {
    const { skipSignatureValidation } = req.hull.connectorConfig;
    const notificationValidator = new NotificationValidator();

    if (!skipSignatureValidation) {
      const headersError = notificationValidator.validateHeaders(req);
      if (headersError) {
        return next(headersError);
      }
    }

    return bodyParser.json({ limit: "10mb" })(req, res, (err) => {
      debug("parsed json body");
      if (err !== undefined) {
        return next(err);
      }
      const payloadError = notificationValidator.validatePayload(req);
      if (payloadError !== null) {
        return next(payloadError);
      }

      return (() => {
        if (!skipSignatureValidation) {
          return Promise.resolve();
        }
        return notificationValidator.validateSignature(req);
      })()
      .then(() => {
        const { body } = req;
        if (body === null || typeof body !== "object") {
          return next(new Error("Missing payload body"));
        }
        const clientCredentials = body.configuration;
        if (!req.hull.requestId && body.notification_id) {
          const timestamp = Math.floor(new Date().getTime() / 1000);
          req.hull.requestId = ["smart-notifier", timestamp, body.notification_id].join(":");
        }
        // $FlowFixMe
        req.hull = Object.assign(req.hull, {
          // $FlowFixMe
          clientCredentials
        });
        return next();
      })
      .catch((error) => {
        next(error);
      });
    });
  };
}

module.exports = credentialsFromNotificationMiddlewareFactory;
