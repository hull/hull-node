// @flow
import type { $Response, NextFunction } from "express";
import type { HullRequestFull, HullNotificationHandlerCallback, HullNotificationHandlerConfiguration } from "../types";

const { Router } = require("express");
const { notificationDefaultFlowControl } = require("../utils");
const { configurationFromNotificationMiddleware, clientMiddleware, timeoutMiddleware, haltOnTimedoutMiddleware, fullContextBodyMiddleware } = require("../middlewares");

/**
 * [notificationHandlerFactory description]
 * @param  {HullNotificationHandlerConfiguration} configuration: HullNotificationHandlerConfiguration [description]
 * @return {[type]}                [description]
 * @example
 * app.use('/smart-notification', notificationHandler({
 *   "user:update": (ctx, message) => {}
 * }));
 */
function notificationHandlerFactory({ HullClient }: Object, configuration: HullNotificationHandlerConfiguration): * {
  const router = Router();

  router.use(timeoutMiddleware());
  router.use(configurationFromNotificationMiddleware());
  router.use(haltOnTimedoutMiddleware());
  router.use(clientMiddleware({ HullClient }));
  router.use(fullContextBodyMiddleware({ requestName: "notification" }));
  router.use(function notificationHandler(req: HullRequestFull, res: $Response, next: NextFunction): mixed {
    if (!req.hull.notification) {
      return next(new Error("Missing Notification payload"));
    }
    const { channel, messages } = req.hull.notification;
    if (!configuration[channel]) {
      return next(new Error("Channel unsupported"));
    }
    const handler: HullNotificationHandlerCallback = typeof configuration[channel] === "function"
      ? configuration[channel]
      : configuration[channel].callback;

    const defaultSuccessFlowControl = notificationDefaultFlowControl(req.hull, channel, "success");
    req.hull.notificationResponse = {
      flow_control: defaultSuccessFlowControl
    };
    // $FlowFixMe
    return handler(req.hull, messages)
      .then(() => {
        res.status(200).json(req.hull.notificationResponse);
      })
      .catch(error => next(error));
  });
  router.use((err: Error, req: HullRequestFull, res: $Response, _next: NextFunction) => {
    if (req.hull.notification) {
      const { channel } = req.hull.notification;
      const defaultErrorFlowControl = notificationDefaultFlowControl(req.hull, channel, "error");
      res.status(500).json(defaultErrorFlowControl);
    }
  });
  return router;
}

module.exports = notificationHandlerFactory;
