// @flow
import type { $Response, NextFunction } from "express";
import type { HullRequestWithClient } from "../types";

const debug = require("debug")("hull-connector:full-context-fetch-middleware");
const bodyParser = require("body-parser");

/**
 * This middleware parses json body and extracts information to fill in full HullContext object.
 */
function fullContextBodyMiddlewareFactory({ requestName }: Object) {
  return function fullContextBodyMiddleware(req: HullRequestWithClient, res: $Response, next: NextFunction) {
    bodyParser.json({ limit: "10mb" })(req, res, (err) => {
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
      const { users_segments, accounts_segments } = body;
      if (!req.hull.requestId && body.notification_id) {
        const timestamp = Math.floor(new Date().getTime() / 1000);
        req.hull.requestId = [requestName, timestamp, body.notification_id].join(":");
      }

      debug("read from body", { connector, users_segments, accounts_segments });

      if (typeof connector !== "object") {
        next(new Error("Body is missing connector object"));
      }

      if (!Array.isArray(users_segments)) {
        next(new Error("Body is missing users_segments array"));
      }

      if (!Array.isArray(accounts_segments)) {
        next(new Error("Body is missing accounts_segments array"));
      }

      // $FlowFixMe
      req.hull = Object.assign(req.hull, {
        // $FlowFixMe
        connector,
        // $FlowFixMe
        usersSegments: users_segments,
        // $FlowFixMe
        accountsSegments: accounts_segments,
        notification: body
      });
      return next();
    });
  };
}

module.exports = fullContextBodyMiddlewareFactory;
