// @flow
import type { $Response, NextFunction } from "express";
import type { HullRequest } from "../types";

const { Router } = require("express");

const { queryConfigurationMiddleware, clientMiddleware, fetchFullContextMiddleware, timeoutMiddleware, haltOnTimedoutMiddleware } = require("../middlewares");

/**
 * This handler allows to handle simple, authorized HTTP calls.
 * By default it picks authorization configuration from query.
 *
 * If you need custom way of passing data, you need to use custom middleware before the handler.
 *
 * Optionally it can cache the response, then provide options.cache object with key
 *
 * @param  {string} jobName [description]
 * @param  {Object}   [options]
 * @param  {Object}   [options.cache]
 * @param  {string}   [options.cache.key]
 * @param  {string}   [options.cache.options]
 * @return {Function}
 * @example
 * app.use("/list", actionHandler((ctx) => {}))
 */
function actionHandler(jobName: string, options: Object) {
  const router = Router();
  router.use(queryConfigurationMiddleware()); // parse config from query
  router.use(clientMiddleware()); // initialize client
  router.use(timeoutMiddleware());
  router.use(fetchFullContextMiddleware({ requestName: "action" }));
  router.use(haltOnTimedoutMiddleware());
  router.use((req: HullRequest, res: $Response, next: NextFunction) => {
    req.hull.enqueue(jobName, {}, options)
      .then(() => {
        res.end("qeueued");
      })
      .catch(error => next(error));
  });
  router.use((err: Error, req: HullRequest, res: $Response, _next: NextFunction) => {
    res.status(500).end("error");
  });

  return router;
}

module.exports = actionHandler;
