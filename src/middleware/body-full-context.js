// @flow
import type { $Response, NextFunction } from "express";
import type { HullRequest } from "../types";

const bodyParser = require("body-parser");

/**
 * This middleware parses json body and extracts information
 * to fill in hull HullContext object.
 */
function bodyFullContextMiddlewareFactory({ requestName }: Object) {
  return function bodyFullContextMiddleware(req: HullRequest, res: $Response, next: NextFunction) {
    bodyParser.json({ limit: "10mb" })(req, res, (err) => {
      if (err !== undefined) {
        return next(err);
      }

      const { body } = req;
      const clientConfig = body.configuration;
      const connector = body.connector;
      const { users_segments, accounts_segments } = body;
      if (!req.hull.requestId && req.body.notification_id) {
        const timestamp = Math.floor(new Date().getTime() / 1000);
        req.hull.requestId = [requestName, timestamp, req.body.notification_id].join(":");
      }
      req.hull = Object.assign({}, req.hull, {
        clientConfig,
        config: clientConfig,

        ship: connector,
        connector,
        segments: users_segments,
        users_segments,
        accounts_segments,
        notification: body
      });
      return next();
    });
  };
}

module.exports = bodyFullContextMiddlewareFactory;
