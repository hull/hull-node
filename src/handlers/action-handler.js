// @flow
import type { $Response, NextFunction } from "express";
import type { HullRequest, HullContext } from "../types";

type HullActionHandlerCallback = (ctx: HullContext) => Promise<*>;
type HullActionHandlerOptions = {
  cache?: {
    key?: string,
    options?: Object
  },
  disableErrorHandling?: boolean
};

const { Router } = require("express");

const { queryConfigurationMiddleware, clientMiddleware, fetchFullContextMiddleware, timeoutMiddleware, haltOnTimedoutMiddleware } = require("../middleware");

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
function actionHandler(handler: HullActionHandlerCallback, { cache = {}, disableErrorHandling = false }: HullActionHandlerOptions): Router {
  const router = Router();
  router.use(queryConfigurationMiddleware()); // parse config from query
  router.use(clientMiddleware()); // initialize client
  router.use(timeoutMiddleware());
  router.use(fetchFullContextMiddleware({ requestName: "action" }));
  router.use(haltOnTimedoutMiddleware());
  router.use((req: HullRequest, res: $Response, next: NextFunction) => {
    (() => {
      if (cache && cache.key) {
        return req.hull.cache.wrap(cache.key, () => {
          return handler(req.hull);
        }, cache.options || {});
      }
      return handler(req.hull);
    })()
      .then((response) => {
        res.json(response);
      })
      .catch(error => next(error));
  });
  if (disableErrorHandling !== true) {
    router.use((err: Error, req: HullRequest, res: $Response, _next: NextFunction) => {
      res.status(500).end("error");
    });
  }

  return router;
}

module.exports = actionHandler;
