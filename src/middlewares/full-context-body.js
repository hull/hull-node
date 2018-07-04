// @flow
import type { $Response, NextFunction } from "express";
import type { HullRequestWithClient } from "../types";

const debug = require("debug")("hull-connector:full-context-body-middleware");
const bodyParser = require("body-parser");

/**
 * This middleware parses json body and extracts information to fill in full HullContext object.
 */
function fullContextBodyMiddlewareFactory({ requestName, strict = true }: Object) {
  return function fullContextBodyMiddleware(req: HullRequestWithClient, res: $Response, next: NextFunction) {
    bodyParser.json({ limit: "10mb" })(req, res, (err) => {
      debug("parsed notification body", err);
      if (err !== undefined) {
        return next(err);
      }

      if (req.body === null
        || req.body === undefined
        || typeof req.body !== "object") {
        return next(new Error("Body must be a json object"));
      }
      const { body } = req;
      const connector = body.connector;
      // pick everything we can
      const { segments, users_segments, accounts_segments, account_segments } = body;
      if (!req.hull.requestId && body.notification_id) {
        const timestamp = Math.floor(new Date().getTime() / 1000);
        req.hull.requestId = [requestName, timestamp, body.notification_id].join(":");
      }

      const usersSegments = users_segments || segments;
      const accountsSegments = accounts_segments || account_segments;
      debug("read from body %o", {
        connector: typeof connector,
        usersSegments: Array.isArray(usersSegments) && usersSegments.length,
        accountsSegments: Array.isArray(accountsSegments) && accountsSegments.length
      });

      if (strict && typeof connector !== "object") {
        return next(new Error("Body is missing connector object"));
      }

      if (strict && !Array.isArray(usersSegments)) {
        return next(new Error("Body is missing segments array"));
      }

      if (strict && !Array.isArray(accountsSegments)) {
        return next(new Error("Body is missing accounts_segments array"));
      }

      // $FlowFixMe
      req.hull = Object.assign(req.hull, {
        // $FlowFixMe
        connector,
        // $FlowFixMe
        usersSegments,
        // $FlowFixMe
        accountsSegments,
        notification: body
      });
      return next();
    });
  };
}

module.exports = fullContextBodyMiddlewareFactory;
