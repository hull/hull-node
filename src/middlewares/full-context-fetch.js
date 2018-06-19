// @flow
import type { $Response, NextFunction } from "express";
import type { HullRequestWithClient } from "../types";


function fetchConnector(ctx): Promise<*> {
  if (ctx.connector) {
    return Promise.resolve(ctx.connector);
  }
  return ctx.cache.wrap("connector", () => {
    return ctx.client.get("app", {});
  });
}

function fetchSegments(ctx, entityType = "users") {
  if (ctx.client === undefined) {
    return Promise.reject(new Error("Missing client"));
  }
  if (ctx[`${entityType}_segments`]) {
    return Promise.resolve(ctx[`${entityType}_segments`]);
  }
  const { id } = ctx.client.configuration();
  return ctx.cache.wrap(`${entityType}_segments`, () => {
    if (ctx.client === undefined) {
      return Promise.reject(new Error("Missing client"));
    }
    return ctx.client.get(
      `/${entityType}_segments`,
      { shipId: id },
      {
        timeout: 5000,
        retry: 1000
      }
    );
  });
}

/**
 * This middleware is responsible for fetching all information
 * using initiated `req.hull.client`.
 * It's responsible for setting
 * - `req.hull.connector`
 * - `req.hull.users_segments`
 * - `req.hull.accounts_segments`
 */
function fetchFullContextMiddlewareFactory({ requestName }: Object = {}) {
  return function fetchFullContextMiddleware(req: HullRequestWithClient, res: $Response, next: NextFunction) {
    if (req.hull === undefined || req.hull.client === undefined) {
      return next(new Error("We need initialized client to fetch connector settings and segments lists"));
    }
    return Promise.all([
      fetchConnector(req.hull),
      fetchSegments(req.hull, "users"),
      fetchSegments(req.hull, "accounts")
    ]).then(([connector, usersSegments, accountsSegments]) => {
      const requestId = [requestName].join("-");
      req.hull = Object.assign({}, req.hull, {
        requestId,
        connector,
        users_segments: usersSegments,
        accounts_segments: accountsSegments,
      });
      next();
    }).catch(error => next(error));
  };
}

module.exports = fetchFullContextMiddlewareFactory;
