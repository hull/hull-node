// @flow
import type { $Response, NextFunction } from "express";
import type { HullContextBase, HullRequestBase } from "../types";

/**
 * This middleware is responsible for setting HullContextBase - the base part of the context.
 */
function contextBaseMiddlewareFactory({
  instrumentation, queue, cache, connectorConfig
}: Object) {
  return function contextBaseMiddleware(req: HullRequestBase, res: $Response, next: NextFunction) {
    const requestId = req.headers["x-hull-request-id"] || "random";

    const context: HullContextBase = {
      requestId,
      hostname: req.hostname,
      options: Object.assign({}, req.body, req.query), // body + query
      connectorConfig,

      cache: cache.getCache(),
      metric: instrumentation.getMetric(),
      enqueue: queue.getEnqueue(),

      service: {},
      shipApp: {}
    };
    req.hull = context;
    next();
  };
}

module.exports = contextBaseMiddlewareFactory;
