// @flow
import type { HullBatchHandlersConfiguration } from "../../types";

const { Router } = require("express");

const {
  credentialsFromQueryMiddleware,
  clientMiddleware,
  timeoutMiddleware,
  haltOnTimedoutMiddleware,
  fullContextBodyMiddleware,
  fullContextFetchMiddleware,
  instrumentationContextMiddleware,
  instrumentationTransientError,
} = require("../../middlewares");

const processingMiddleware = require("./processing-middleware");
const errorMiddleware = require("./error-middleware");

/**
 * [notificationHandlerFactory description]
 * @param  {HullNotificationHandlerConfiguration} configuration: HullNotificationHandlerConfiguration [description]
 * @return {[type]}                [description]
 * @example
 * app.use("/batch", notificationHandler({
 *   "user:update": (ctx, message) => {}
 * }));
 */
function batchExtractHandlerFactory(
  configuration: HullBatchHandlersConfiguration
): * {
  const router = Router(); //eslint-disable-line new-cap
  router.use(timeoutMiddleware());
  router.use(credentialsFromQueryMiddleware()); // parse query
  router.use(clientMiddleware()); // initialize client
  router.use(haltOnTimedoutMiddleware());
  router.use(instrumentationContextMiddleware({ handler: "batch" }));
  router.use(
    fullContextBodyMiddleware({ requestName: "batch", strict: false })
  ); // get rest of the context from body
  router.use(fullContextFetchMiddleware({ requestName: "batch" })); // if something is missing at body
  router.use(haltOnTimedoutMiddleware());
  router.use(processingMiddleware(configuration));
  router.use(instrumentationTransientError());
  router.use(errorMiddleware());
  return router;
}

module.exports = batchExtractHandlerFactory;
