// @flow
import type { $Response, NextFunction } from "express";
import type { HullRequestFull } from "../../types";

const debug = require("debug")("hull-connector:notification-handler");

const { notificationDefaultFlowControl } = require("../../utils");
const { TransientError, NotificationValidationError } = require("../../errors");

function errorToResponse(error) {
  return {
    message: error.message,
    name: error.constructor.name,
    code: error.code || "N/A",
  };
}

function notificationHandlerErrorMiddlewareFactory() {
  return function notificationHandlerErrorMiddleware(
    err: Error,
    req: HullRequestFull,
    res: $Response,
    next: NextFunction
  ) {
    debug("error", err.message, err.constructor && err.constructor.name);
    // we didn't get a notification
    if (typeof req.hull.notification !== "object") {
      // and this is caused by a validation error
      if (err instanceof NotificationValidationError) {
        const flowControl = notificationDefaultFlowControl(
          req.hull,
          "ship:update",
          "error"
        );
        res
          .status(400)
          .json({ flow_control: flowControl, error: errorToResponse(err) });
      } else {
        res.status(400).json({
          error: "didn't get a correct notification",
          message: err.message,
        });
      }
      return next(err);
    }
    const { channel } = req.hull.notification;

    // channel unsupported
    if (err.message === "Channel unsupported") {
      const defaultUnsupportedFlowControl = notificationDefaultFlowControl(
        req.hull,
        channel,
        "unsupported"
      );
      return res.status(200).json({
        flow_control: defaultUnsupportedFlowControl,
        error: errorToResponse(err),
      });
    }

    const defaultErrorFlowControl = notificationDefaultFlowControl(
      req.hull,
      channel,
      "error"
    );

    // if we have transient error
    if (err instanceof TransientError) {
      return res.status(503).json({
        flow_control: defaultErrorFlowControl,
        error: errorToResponse(err),
      });
    }

    res.status(500).json({
      flow_control: defaultErrorFlowControl,
      error: errorToResponse(err),
    });
    return next(err);
  };
}

module.exports = notificationHandlerErrorMiddlewareFactory;
