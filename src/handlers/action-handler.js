// @flow
import type { $Response, NextFunction } from "express";
import type { HullRequest, HullContext } from "../types";

type HullActionHandlerCallback = (ctx: HullContext) => Promise<*>;
type HullActionHandlerOptions = {
  cache?: {
    key?: string,
    options?: Object
  },
  disableErrorHandling?: boolean,
  respondWithError?: boolean
};
const debug = require("debug")("hull-connector:action-handler");
const { Router } = require("express");

const { queryConfigurationMiddleware, fetchFullContextMiddleware, timeoutMiddleware, haltOnTimedoutMiddleware, clientMiddleware } = require("../middlewares");

/**
 * This handler allows to handle simple, authorized HTTP calls.
 * By default it picks authorization configuration from query.
 *
 * If you need custom way of passing data, you need to use custom middleware before the handler.
 *
 * Optionally it can cache the response, then provide options.cache object with key
 *
 * @param  {Object}
 * @param  {Function} handler [description
 * @param  {Object}   [options]
 * @param  {Object}   [options.cache]
 * @param  {string}   [options.cache.key]
 * @param  {string}   [options.cache.options]
 * @return {Function}
 * @example
 * const { actionHandler } = require("hull").handlers;
 * app.use("/list", actionHandler((ctx) => {}))
 */
function actionHandlerFactory({ HullClient }: Object, handler: HullActionHandlerCallback, { cache = {}, disableErrorHandling = false, respondWithError = false }: HullActionHandlerOptions = {}): Router {
  const router = Router();
  router.use(queryConfigurationMiddleware()); // parse config from query
  router.use(clientMiddleware({ HullClient })); // initialize client
  router.use(timeoutMiddleware());
  router.use(fetchFullContextMiddleware({ requestName: "action" }));
  router.use(haltOnTimedoutMiddleware());
  router.use(function actionHandler(req: HullRequest, res: $Response, next: NextFunction) {
    (() => {
      debug("processing");
      if (cache && cache.key) {
        return req.hull.cache.wrap(cache.key, () => {
          return handler(req.hull);
        }, cache.options || {});
      }
      debug("calling handler");
      return handler(req.hull);
    })()
      .then((response) => {
        debug("handler response", response);
        res.end(response);
      })
      .catch(error => next(error));
  });
  if (disableErrorHandling !== true) {
    router.use(function actionHandlerErrorMiddleware(err: Error, req: HullRequest, res: $Response, _next: NextFunction) {
      debug("error", err);
      res.status(500);
      if (respondWithError) {
        return res.end(err.toString());
      }
      return res.end("error");
    });
  }

  return router;
}

module.exports = actionHandlerFactory;
