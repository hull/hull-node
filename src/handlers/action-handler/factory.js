// @flow
import type { $Response, NextFunction } from "express";
import type { HullHandlersConfigurationEntry, HullRequestFull } from "../../types";

// type HullActionHandlerOptions = {
//   cache?: {
//     key?: string,
//     options?: Object
//   },
//   disableErrorHandling?: boolean,
//   respondWithError?: boolean
// };
const debug = require("debug")("hull-connector:action-handler");
const { Router } = require("express");

const { TransientError } = require("../../errors");
const { credentialsFromQueryMiddleware, fullContextFetchMiddleware, timeoutMiddleware, haltOnTimedoutMiddleware, clientMiddleware, instrumentationContextMiddleware } = require("../../middlewares");
const { normalizeHandlersConfigurationEntry } = require("../../utils");

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
 * @param  {Object|Function} configurationEntry [description]
 * @param  {Object} [configurationEntry.options]
 * @param  {Object} [configurationEntry.options.disableErrorHandling] if you want to disable internal
 * @param  {Object} [configurationEntry.options.cache]
 * @param  {string} [configurationEntry.options.cache.key]
 * @param  {string} [configurationEntry.options.cache.options]
 * @return {Function}
 * @example
 * const { actionHandler } = require("hull").handlers;
 * app.use("/list", actionHandler((ctx) => {}))
 */
function actionHandlerFactory(configurationEntry: HullHandlersConfigurationEntry): Router {
  const { callback, options } = normalizeHandlersConfigurationEntry(configurationEntry);
  const {
    cache = {},
    disableErrorHandling = false,
    respondWithError = false
  } = options;

  const router = Router();
  router.use(credentialsFromQueryMiddleware()); // parse config from query
  router.use(timeoutMiddleware());
  router.use(clientMiddleware()); // initialize client
  router.use(haltOnTimedoutMiddleware());
  router.use(instrumentationContextMiddleware());
  router.use(fullContextFetchMiddleware({ requestName: "action" }));
  router.use(haltOnTimedoutMiddleware());
  router.use(function actionHandler(req: HullRequestFull, res: $Response, next: NextFunction) {
    (() => {
      debug("processing");
      if (cache && cache.key) {
        return req.hull.cache.wrap(cache.key, () => {
          // $FlowFixMe
          return callback(req.hull);
        }, cache.options || {});
      }
      debug("calling callback");
      // $FlowFixMe
      return callback(req.hull);
    })()
      .then((response) => {
        debug("callback response", response);
        res.end(response);
      })
      .catch(error => next(error));
  });
  if (disableErrorHandling !== true) {
    router.use(function actionHandlerErrorMiddleware(err: Error, req: HullRequestFull, res: $Response, next: NextFunction) {
      debug("error", err);

      if (respondWithError) {
        res.end(err.toString());
      } else {
        res.end("error");
      }
      // if we have non transient error
      if (err instanceof TransientError) {
        res.status(503);
      } else {
        res.status(500);
        next(err);
      }
    });
  }

  return router;
}

module.exports = actionHandlerFactory;
