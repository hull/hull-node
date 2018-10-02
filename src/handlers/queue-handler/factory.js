// @flow
import type { $Response, NextFunction } from "express";
import type { HullRequestFull } from "../../types";

const { Router } = require("express");

const {
  credentialsFromQueryMiddleware,
  clientMiddleware,
  fullContextFetchMiddleware,
  timeoutMiddleware,
  haltOnTimedoutMiddleware,
  instrumentationContextMiddleware,
} = require("../../middlewares");

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
  const router = Router(); //eslint-disable-line new-cap
  router.use(credentialsFromQueryMiddleware()); // parse config from query
  router.use(timeoutMiddleware());
  router.use(clientMiddleware()); // initialize client
  router.use(haltOnTimedoutMiddleware());
  router.use(instrumentationContextMiddleware());
  router.use(fullContextFetchMiddleware({ requestName: "action" }));
  router.use(haltOnTimedoutMiddleware());
  router.use((req: HullRequestFull, res: $Response, next: NextFunction) => {
    req.hull
      .enqueue(jobName, {}, options)
      .then(() => {
        res.end("qeueued");
      })
      .catch(error => next(error));
  });
  router.use(
    (err: Error, req: HullRequestFull, res: $Response, _next: NextFunction) => { // eslint-disable-line no-unused-vars
      res.status(500).end("error");
    }
  );

  return router;
}

module.exports = actionHandler;
