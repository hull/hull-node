// @flow
import type { $Response, NextFunction } from "express";
import type {
  HullRequestFull,
  HullNotificationResponse,
  HullNotificationHandlerConfiguration
} from "../../types";

const debug = require("debug")("hull-connector:notification-handler");

const { notificationDefaultFlowControl } = require("../../utils");

function notificationHandlerProcessingMiddlewareFactory(
  handlers: HullNotificationHandlerConfiguration
) {
  return function notificationHandlerProcessingMiddleware(
    req: HullRequestFull,
    res: $Response,
    next: NextFunction
  ): mixed {
    if (!req.hull.notification) {
      return next(new Error("Missing Notification payload"));
    }
    const { channel, messages } = req.hull.notification;
    debug("notification", {
      channel,
      messages: Array.isArray(messages) && messages.length
    });
    if (handlers[channel] === undefined) {
      return next(new Error("Channel unsupported"));
    }
    const { callback } = handlers[channel];

    // We aren't able to define exactly which channel we're sending so the `messages` object can have several shapes. Disable for now
    // $FlowFixMe
    return callback(req.hull, messages)
      .then((response: HullNotificationResponse) => {
        const notificationResponse = response || {
          flow_control: notificationDefaultFlowControl(
            req.hull,
            channel,
            "success"
          )
        };

        res.status(200).json(notificationResponse);
        return notificationResponse;
      })
      .catch(error => next(error));
  };
}

module.exports = notificationHandlerProcessingMiddlewareFactory;
