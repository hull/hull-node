// @flow
import type { $Response, NextFunction } from "express";
import type { HullRequest, HullContext } from "../types";

type HullSchedulerHandlerCallback = (ctx: HullContext) => Promise<*>;
type HullSchedulerHandlerOptions = {
  disableErrorHandling?: boolean
};

const { Router } = require("express");

const { queryConfigurationMiddleware, clientMiddleware, bodyFullContextMiddleware, timeoutMiddleware, haltOnTimedoutMiddleware } = require("../middlewares");

/**
 * This handler allows to handle simple, authorized HTTP calls.
 * By default it picks authorization configuration from query.
 *
 * If you need custom way of passing data, you need to use custom middleware before the handler.
 *
 * Optionally it can cache the response, then provide options.cache object with key
 *
 * @param  {Function} handler [description]
 * @param  {Object}   [options]
 * @param  {Object}   [options.cache]
 * @param  {string}   [options.cache.key]
 * @param  {string}   [options.cache.options]
 * @return {Function}
 * @example
 * app.use("/list", actionHandler((ctx) => {}))
 */
function schedulerHandlerFactory(handler: HullSchedulerHandlerCallback, { disableErrorHandling = false }: HullSchedulerHandlerOptions) {
  const router = Router();

  router.use(timeoutMiddleware());
  router.use(queryConfigurationMiddleware()); // parse query
  router.use(haltOnTimedoutMiddleware());
  router.use(clientMiddleware()); // initialize client
  router.use(haltOnTimedoutMiddleware());
  router.use(bodyFullContextMiddleware({ requestName: "scheduler" })); // get rest of the context from body
  router.use(haltOnTimedoutMiddleware());
  router.use(function schedulerHandler(req: HullRequest, res: $Response, next: NextFunction) {
    handler(req.hull)
      .then((response) => {
        res.json(response);
      })
      .catch(error => next(error));
  });
  if (disableErrorHandling === true) {
    router.use((err: Error, req: HullRequest, res: $Response, _next: NextFunction) => {
      res.status(503).end("err");
    });
  }
  return router;
}

module.exports = schedulerHandlerFactory;
