// @flow
import type { $Response, NextFunction } from "express";
import type {
  HullExternalHandlerConfigurationEntry,
  HullRequestFull
} from "../../types";
const extractRequestContent = require("../../lib/extract-request-content");
const debug = require("debug")("hull-connector:action-handler");
const express = require("express");

const { TransientError, ValidationError } = require("../../errors");
const {
  credentialsFromQueryMiddleware,
  fullContextFetchMiddleware,
  timeoutMiddleware,
  haltOnTimedoutMiddleware,
  clientMiddleware,
  instrumentationContextMiddleware
} = require("../../middlewares");

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
function actionHandlerFactory({
  callback,
  options = {}
}: HullExternalHandlerConfigurationEntry): express$Router {
  const {
    // requireAuthentication = false,
    cache = {},
    disableErrorHandling = false,
    respondWithError = false
  } = options;
  debug("options", options);
  const router = express.Router(); //eslint-disable-line new-cap
  router.use(credentialsFromQueryMiddleware()); // parse config from query
  router.use(timeoutMiddleware());
  router.use(clientMiddleware()); // initialize client
  router.use(haltOnTimedoutMiddleware());
  router.use(instrumentationContextMiddleware());
  router.use(fullContextFetchMiddleware({ requestName: "action" }));
  router.use(haltOnTimedoutMiddleware());
  //eslint-disable-next-line no-unused-vars
  router.use((req: HullRequestFull, res: $Response, next: NextFunction) => {
    try {
      const { client, connector } = req.hull;
      // $FlowFixMe
      if (!client | !connector) {
        throw new ValidationError(
          "missing or invalid credentials",
          "INVALID_CREDENTIALS",
          400
        );
      }
    } catch (e) {
      throw e;
    }
  });
  router.use((req: HullRequestFull, res: $Response, next: NextFunction) => {
    (() => {
      const message = extractRequestContent(req);
      debug("processing");
      if (cache && cache.key) {
        return req.hull.cache.wrap(
          cache.key,
          () => callback(req.hull, [message]),
          cache.options || {}
        );
      }
      return callback(req.hull, [message]);
    })()
      .then(response => {
        debug("callback response", response);
        res.end(response);
      })
      .catch(error => next(error));
  });
  if (disableErrorHandling !== true) {
    router.use(
      (
        err: Error | TransientError | ValidationError,
        req: HullRequestFull,
        res: $Response,
        next: NextFunction
      ) => {
        debug("error", err.message, err.constructor.name, { respondWithError });
        // TODO : Work on Error handling

        // $FlowFixMe;
        const { status = 200 } = err;
        // if we have non transient error
        res.status(status);

        if (respondWithError) {
          res.send(err.toString());
        } else {
          res.send("error");
        }
        // if we have non transient error
        if (!(err instanceof TransientError)) {
          next(err);
        }
      }
    );
  }

  return router;
}

module.exports = actionHandlerFactory;
