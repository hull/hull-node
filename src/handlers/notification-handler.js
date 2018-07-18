// @flow
import type { $Response, NextFunction } from "express";
import type { HullRequestFull, HullHandlersConfiguration } from "../types";

const debug = require("debug")("hull-connector:notification-handler");
const { Router } = require("express");
const { normalizeHandlersConfiguration, notificationDefaultFlowControl } = require("../utils");
const { credentialsFromNotificationMiddleware, clientMiddleware, timeoutMiddleware, haltOnTimedoutMiddleware, fullContextBodyMiddleware } = require("../middlewares");

/**
 * [notificationHandlerFactory description]
 * @param  {HullNotificationHandlerConfiguration} configuration: HullNotificationHandlerConfiguration [description]
 * @return {[type]}                [description]
 * @example
 * app.use('/smart-notification', notificationHandler({
 *   "user:update": (ctx, message) => {}
 * }));
 */
function notificationHandlerFactory({ HullClient }: Object, configuration: HullHandlersConfiguration): * {
  const router = Router();
  const normalizedConfiguration = normalizeHandlersConfiguration(configuration);
  router.use(timeoutMiddleware());
  router.use(credentialsFromNotificationMiddleware());
  router.use(haltOnTimedoutMiddleware());
  router.use(clientMiddleware({ HullClient }));
  router.use(fullContextBodyMiddleware({ requestName: "notification" }));
  router.use(function notificationHandler(req: HullRequestFull, res: $Response, next: NextFunction): mixed {
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
  });
  router.use((err: Error, req: HullRequestFull, res: $Response, _next: NextFunction) => {
    debug("got error", err);
    if (req.hull.notification) {
      const { channel } = req.hull.notification;
      if (err.message === "Channel unsupported") {
        const defaultUnsupportedFlowControl = notificationDefaultFlowControl(req.hull, channel, "unsupported");
        return res.status(404).json(defaultUnsupportedFlowControl);
      }
      const defaultErrorFlowControl = notificationDefaultFlowControl(req.hull, channel, "error");
      res.status(500).json(defaultErrorFlowControl);
    }
    return null;
  });
  return router;
}

module.exports = notificationHandlerFactory;
