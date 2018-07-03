// @flow
import type { $Response, NextFunction } from "express";
import type { HullContextBase, HullRequestBase } from "../types";

/**
 * This middleware is responsible for setting HullContextBase - the base part of the context.
 */
function contextBaseMiddlewareFactory({
  instrumentation, queue, cache, connectorConfig, clientConfig
}: Object) {
  return function contextBaseMiddleware(req: HullRequestBase, res: $Response, next: NextFunction) {
    const context = {};
    context.hostname = req.hostname || "";
    context.options = Object.assign({}, req.body, req.query); // body + quer;
    context.clientConfig = clientConfig;
    context.connectorConfig = connectorConfig;
    context.service = {};
    context.cache = cache.getConnectorCache(context);
    context.metric = instrumentation.getMetric(context);
    context.enqueue = queue.getEnqueue(context);

    req.hull = (context: HullContextBase);
    next();
  };
}

module.exports = contextBaseMiddlewareFactory;
