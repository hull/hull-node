// @flow
import type { $Response, NextFunction } from "express";
import type { HullRequestFull } from "../../types";

const debug = require("debug")("hull-connector:notification-handler");

const { notificationDefaultFlowControl } = require("../../utils");
const { TransientError } = require("../../errors");

function notificationHandlerErrorMiddlewareFactory() {
  return function notificationHandlerErrorMiddleware(err: Error, req: HullRequestFull, res: $Response, next: NextFunction) {
    debug("got error", err.message);
    if (typeof req.hull.notification !== "object") {
      return res.status(500).json({ error: "didn't get a correct notification" });
    }
    const { channel } = req.hull.notification;

    // channel unsupported
    if (err.message === "Channel unsupported") {
      const defaultUnsupportedFlowControl = notificationDefaultFlowControl(req.hull, channel, "unsupported");
      return res.status(200).json({ flow_control: defaultUnsupportedFlowControl });
    }

    const defaultErrorFlowControl = notificationDefaultFlowControl(req.hull, channel, "error");

    // if we have transient error
    if (err instanceof TransientError) {
      return res.status(503).json({ flow_control: defaultErrorFlowControl });
    }

    res.status(500).json({ flow_control: defaultErrorFlowControl });
    return next(err);
  };
}


module.exports = notificationHandlerErrorMiddlewareFactory;
