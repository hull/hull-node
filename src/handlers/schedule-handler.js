// @flow
import type { $Response, NextFunction } from "express";
import type { HullRequestFull, HullHandlersConfigurationEntry } from "../types";

// type HullSchedulerHandlerCallback = (ctx: HullContextFull) => Promise<*>;
// type HullSchedulerHandlerOptions = {
//   disableErrorHandling?: boolean
// };

const { Router } = require("express");

const { credentialsFromQueryMiddleware, clientMiddleware, fullContextBodyMiddleware, timeoutMiddleware, haltOnTimedoutMiddleware } = require("../middlewares");
const { normalizeHandlersConfigurationEntry } = require("../utils");
/**
 * This handler allows to handle simple, authorized HTTP calls.
 * By default it picks authorization configuration from query.
 *
 * If you need custom way of passing data, you need to use custom middleware before the handler.
 *
 * Optionally it can cache the response, then provide options.cache object with key
 *
 * @param  {Objecct}  dependencies
 * @param  {Object|Function} configurationEntry [description]
 * @param  {Object}   [configurationEntry.options]
 * @param  {Object}   [configurationEntry.options.cache]
 * @param  {string}   [configurationEntry.options.cache.key]
 * @param  {string}   [configurationEntry.options.cache.options]
 * @return {Function}
 * @example
 * app.use("/list", actionHandler((ctx) => {}))
 */
function scheduleHandlerFactory({ HullClient }: Object, configurationEntry: HullHandlersConfigurationEntry) {
  const router = Router();
  const { callback, options } = normalizeHandlersConfigurationEntry(configurationEntry);
  const { disableErrorHandling = false } = options;

  router.use(timeoutMiddleware());
  router.use(credentialsFromQueryMiddleware()); // parse query
  router.use(haltOnTimedoutMiddleware());
  router.use(clientMiddleware({ HullClient })); // initialize client
  router.use(haltOnTimedoutMiddleware());
  router.use(fullContextBodyMiddleware({ requestName: "scheduler" })); // get rest of the context from body
  router.use(haltOnTimedoutMiddleware());
  router.use(function scheduleHandler(req: HullRequestFull, res: $Response, next: NextFunction) {
    // $FlowFixMe
    callback(req.hull)
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
