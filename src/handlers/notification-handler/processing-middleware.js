// @flow
import type { $Response, NextFunction } from "express";
import type { HullRequestFull, HullNormalizedHandlersConfiguration } from "../../types";

const debug = require("debug")("hull-connector:notification-handler");

const { notificationDefaultFlowControl } = require("../../utils");

function notificationHandlerProcessingMiddlewareFactory(normalizedConfiguration: HullNormalizedHandlersConfiguration) {
  return function notificationHandlerProcessingMiddleware(req: HullRequestFull, res: $Response, next: NextFunction): mixed {
    if (!req.hull.notification) {
      return next(new Error("Missing Notification payload"));
    }
    const { channel, messages } = req.hull.notification;
    debug("notification", { channel, messages: Array.isArray(messages) && messages.length });
    if (normalizedConfiguration[channel] === undefined) {
      return next(new Error("Channel unsupported"));
    }
    const { callback } = normalizedConfiguration[channel];

    const defaultSuccessFlowControl = notificationDefaultFlowControl(req.hull, channel, "success");
    req.hull.notificationResponse = {
      flow_control: defaultSuccessFlowControl
    };
    // $FlowFixMe
    return callback(req.hull, messages)
      .then(() => {
        res.status(200).json(req.hull.notificationResponse);
      })
      .catch(error => next(error));
  };
}

module.exports = notificationHandlerProcessingMiddlewareFactory;
