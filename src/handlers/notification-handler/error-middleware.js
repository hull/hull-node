// @flow
import type { $Response, NextFunction } from "express";
import type { HullRequestFull } from "../../types";

const debug = require("debug")("hull-connector:notification-handler");

const { notificationDefaultFlowControl } = require("../../utils");
const { TransientError } = require("../../errors");

function notificationHandlerErrorMiddlewareFactory() {
  return function notificationHandlerErrorMiddleware(err: Error, req: HullRequestFull, res: $Response, _next: NextFunction) {
    debug("got error", err);
    if (typeof req.hull.notification !== "object") {
      return res.status(500).json({ error: "didn't get a correct notification" });
    }
    const { channel } = req.hull.notification;
    if (err.message === "Channel unsupported") {
      const defaultUnsupportedFlowControl = notificationDefaultFlowControl(req.hull, channel, "unsupported");
      return res.status(404).json(defaultUnsupportedFlowControl);
    }

    if (err instanceof TransientError) {
      debug("TransientError", err.message);
    }

    const defaultErrorFlowControl = notificationDefaultFlowControl(req.hull, channel, "error");
    return res.status(500).json(defaultErrorFlowControl);
  };
}


module.exports = notificationHandlerErrorMiddlewareFactory;
