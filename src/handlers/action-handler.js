// @flow
import type { $Response, NextFunction } from "express";
import type { HullRequestFull, HullContextFull } from "../types";

type HullActionHandlerCallback = (ctx: HullContextFull) => Promise<*>;
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

const { credentialsFromQueryMiddleware, fullContextFetchMiddleware, timeoutMiddleware, haltOnTimedoutMiddleware, clientMiddleware } = require("../middlewares");

/**
 * This handler allows to handle simple, authorized HTTP calls.
 * By default it picks authorization configuration from query.
 *
 * If you need custom way of passing data, you need to use custom middleware before the handler.
 *
 * Optionally it can cache the response, to use it provide `options.cache` parameter with cache key
 * Metrics:
 * connector.action-handler.requests
 * connector.action-handler.duration
 * connector.action-handler.api-calls
 *
 *
 * @param  {Object}
 * @param  {Function} handler [description
 * @param  {Object}   [options]
 * @param  {Object}   [options.disableErrorHandling] if you want to disable internal
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
  router.use(credentialsFromQueryMiddleware()); // parse config from query
  router.use(clientMiddleware({ HullClient })); // initialize client
  router.use(timeoutMiddleware());
  router.use(fullContextFetchMiddleware({ requestName: "action" }));
  router.use(haltOnTimedoutMiddleware());
  router.use(function actionHandler(req: HullRequestFull, res: $Response, next: NextFunction) {
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
    router.use(function actionHandlerErrorMiddleware(err: Error, req: HullRequestFull, res: $Response, _next: NextFunction) {
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
