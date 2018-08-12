// @flow
import type { $Response, NextFunction } from "express";
import type { HullRequestWithClient } from "../types";
import type { HullSegment, HullConnector } from "hull-client";

const debug = require("debug")("hull-connector:full-context-fetch-middleware");

function fetchConnector(ctx): Promise<HullConnector> {
  debug("fetchConnector", typeof ctx.connector);
  if (ctx.connector) {
    return Promise.resolve(ctx.connector);
  }
  return ctx.cache.wrap(
    "connector",
    () => {
      debug("fetchConnector - calling API");
      return ctx.client.get("app", {});
    },
    { ttl: 60000 }
  );
}

function fetchSegments(ctx, entityType = "users"): Promise<Array<HullSegment>> {
  debug("fetchSegments", entityType, typeof ctx[`${entityType}sSegments`]);
  if (ctx.client === undefined) {
    return Promise.reject(new Error("Missing client"));
  }
  if (ctx[`${entityType}sSegments`]) {
    return Promise.resolve(ctx[`${entityType}sSegments`]);
  }
  const { id } = ctx.client.configuration();
  return ctx.cache.wrap(
    `${entityType}s_segments`,
    () => {
      if (ctx.client === undefined) {
        return Promise.reject(new Error("Missing client"));
      }
      debug("fetchSegments - calling API");
      return ctx.client.get(
        `/${entityType}s_segments`,
        { shipId: id },
        {
          timeout: 5000,
          retry: 1000,
        }
      );
    },
    { ttl: 60000 }
  );
}

/**
 * This middleware is responsible for fetching all information
 * using initiated `req.hull.client`.
 * It's responsible for setting
 * - `req.hull.connector`
 * - `req.hull.usersSegments`
 * - `req.hull.accountsSegments`
 * It also honour existing values at this properties. If they are already set they won't be overwritten.
 */
function fullContextFetchMiddlewareFactory({
  requestName,
  strict = true,
}: Object = {}) {
  return function fullContextFetchMiddleware(
    req: HullRequestWithClient,
    res: $Response,
    next: NextFunction
  ) {
    const { hull } = req;
    if (hull === undefined || hull.client === undefined) {
      return next(
        new Error(
          "We need initialized client to fetch connector settings and segments lists"
        )
      );
    }

    return Promise.all([
      fetchConnector(hull),
      fetchSegments(hull, "user"),
      fetchSegments(hull, "account"),
    ])
      .then(([connector, usersSegments = [], accountsSegments = []]) => {

        debug("received responses %o", {
          connector: typeof connector,
          usersSegments: Array.isArray(usersSegments),
          accountsSegments: Array.isArray(accountsSegments),
        });

        if (strict && typeof connector !== "object") {
          return next(new Error("Unable to fetch connector object"));
        }

        if (strict && !Array.isArray(usersSegments)) {
          return next(new Error("Unable to fetch usersSegments array"));
        }

        if (strict && !Array.isArray(accountsSegments)) {
          return next(new Error("Unable to fetch accountsSegments array"));
        }

        req.hull.connector = connector;
        req.hull.usersSegments = usersSegments;
        req.hull.accountsSegments = accountsSegments;

        if (requestName) {
          req.hull.requestId = [requestName].join("-");
        }
        return next();
      })
      .catch(error => next(error));
  };
}

module.exports = fullContextFetchMiddlewareFactory;
