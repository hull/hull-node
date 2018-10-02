// @flow
import type { $Response, NextFunction } from "express";
import type {
  HullRequestFull,
  HullSchedulerHandlerConfigurationEntry
} from "../../types";
const extractRequestContent = require("../../lib/extract-request-content");
const express = require("express");
const debug = require("debug")("hull-connector:schedule-handler");

const { TransientError } = require("../../errors");
const {
  credentialsFromQueryMiddleware,
  clientMiddleware,
  fullContextBodyMiddleware,
  timeoutMiddleware,
  haltOnTimedoutMiddleware,
  instrumentationContextMiddleware
} = require("../../middlewares");

/**
 * This handler allows to handle simple, authorized HTTP calls.
 * By default it picks authorization configuration from query.
 *
 * If you need custom way of passing data, you need to use custom middleware before the handler.
 *
 * Optionally it can cache the response, then provide options.cache object with key
 *
 * @param  {Object|Function} configurationEntry [description]
 * @param  {Object}   [configurationEntry.options]
 * @param  {Object}   [configurationEntry.options.cache]
 * @param  {string}   [configurationEntry.options.cache.key]
 * @param  {string}   [configurationEntry.options.cache.options]
 * @return {Function}
 * @example
 * app.use("/list", actionHandler((ctx) => {}))
 */
function scheduleHandlerFactory({
  callback
}: HullSchedulerHandlerConfigurationEntry) {
  const router = express.Router(); //eslint-disable-line new-cap

  router.use(credentialsFromQueryMiddleware()); // parse query
  router.use(clientMiddleware()); // initialize client
  router.use(timeoutMiddleware());
  router.use(fullContextBodyMiddleware({ requestName: "scheduler" })); // get rest of the context from body
  router.use(instrumentationContextMiddleware());
  router.use(haltOnTimedoutMiddleware());
  router.use((req: HullRequestFull, res: $Response, next: NextFunction) => {
    callback(req.hull, [extractRequestContent(req)]).then(
      r => res.json(r),
      err => next(err)
    );
  });
  router.use(
    (err: Error, req: HullRequestFull, res: $Response, next: NextFunction) => {
      debug("error", err);
      // if we have transient error
      if (err instanceof TransientError) {
        return res.status(503).end("transient-error");
      }
      // else pass it to the global error middleware
      return next(err);
    }
  );
  return router;
}

module.exports = scheduleHandlerFactory;
