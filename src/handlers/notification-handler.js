// @flow
import type { $Response, NextFunction } from "express";
import type { HullRequestFull, HullNotificationHandlerCallback, HullNotificationHandlerConfiguration } from "../types";

const debug = require("debug")("hull-connector:notification-handler");
const { Router } = require("express");
const { notificationDefaultFlowControl } = require("../utils");
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
function notificationHandlerFactory({ HullClient }: Object, configuration: HullNotificationHandlerConfiguration): * {
  const router = Router();

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
    let handlerCallback: HullNotificationHandlerCallback | void;

    if (typeof configuration[channel] === "function") {
      handlerCallback = configuration[channel];
    } else if (typeof configuration[channel] === "object" && typeof configuration[channel].callback === "function") {
      handlerCallback = configuration[channel].callback;
    }
    // const handlerOptions = (typeof configuration[channel] === "object" && configuration[channel].options) || {};

    if (typeof handlerCallback !== "function") {
      return next(new Error("Channel unsupported"));
    }

    const defaultSuccessFlowControl = notificationDefaultFlowControl(req.hull, channel, "success");
    req.hull.notificationResponse = {
      flow_control: defaultSuccessFlowControl
    };
    // $FlowFixMe
    return handlerCallback(req.hull, messages)
      .then(() => {
        res.status(200).json(req.hull.notificationResponse);
      })
      .catch(error => next(error));
  });
  router.use((err: Error, req: HullRequestFull, res: $Response, _next: NextFunction) => {
    debug("got error", err);
    if (req.hull.notification) {
      const { channel } = req.hull.notification;
      const defaultErrorFlowControl = notificationDefaultFlowControl(req.hull, channel, "error");
      res.status(500).json(defaultErrorFlowControl);
    }
  });
  return router;
}

module.exports = notificationHandlerFactory;
