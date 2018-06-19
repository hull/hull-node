// @flow
import type { $Response, NextFunction } from "express";
import type { HullRequestFull, HullContextFull } from "../types";

type HullSchedulerHandlerCallback = (ctx: HullContextFull) => Promise<*>;
type HullSchedulerHandlerOptions = {
  disableErrorHandling?: boolean
};

const { Router } = require("express");

const { configurationFromQueryMiddleware, clientMiddleware, fullContextBodyMiddleware, timeoutMiddleware, haltOnTimedoutMiddleware } = require("../middlewares");

/**
 * This handler allows to handle simple, authorized HTTP calls.
 * By default it picks authorization configuration from query.
 *
 * If you need custom way of passing data, you need to use custom middleware before the handler.
 *
 * Optionally it can cache the response, then provide options.cache object with key
 *
 * @param  {Objecct}  dependencies
 * @param  {Function} handler [description]
 * @param  {Object}   [options]
 * @param  {Object}   [options.cache]
 * @param  {string}   [options.cache.key]
 * @param  {string}   [options.cache.options]
 * @return {Function}
 * @example
 * app.use("/list", actionHandler((ctx) => {}))
 */
function scheduleHandlerFactory({ HullClient }: Object, handler: HullSchedulerHandlerCallback, { disableErrorHandling = false }: HullSchedulerHandlerOptions) {
  const router = Router();

  router.use(timeoutMiddleware());
  router.use(configurationFromQueryMiddleware()); // parse query
  router.use(haltOnTimedoutMiddleware());
  router.use(clientMiddleware({ HullClient })); // initialize client
  router.use(haltOnTimedoutMiddleware());
  router.use(fullContextBodyMiddleware({ requestName: "scheduler" })); // get rest of the context from body
  router.use(haltOnTimedoutMiddleware());
  router.use(function scheduleHandler(req: HullRequestFull, res: $Response, next: NextFunction) {
    handler(req.hull)
      .then((response) => {
        res.json(response);
      })
      .catch(error => next(error));
  });
  if (disableErrorHandling === true) {
    router.use((err: Error, req: HullRequestFull, res: $Response, _next: NextFunction) => {
      res.status(503).end("err");
    });
  }
  return router;
}

module.exports = scheduleHandlerFactory;
