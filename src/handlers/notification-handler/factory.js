// @flow
import type { $Response, NextFunction } from "express";
import type { HullHandlersConfiguration, HullRequestFull } from "../../types";

const { Router } = require("express");
const { normalizeHandlersConfiguration } = require("../../utils");
const {
  credentialsFromNotificationMiddleware,
  clientMiddleware,
  timeoutMiddleware,
  haltOnTimedoutMiddleware,
  fullContextBodyMiddleware,
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
 * app.use('/smart-notification', notificationHandler({
 *   "user:update": (ctx, message) => {}
 * }));
 */
function notificationHandlerFactory(
  configuration: HullHandlersConfiguration
): * {
  const router = Router();
  const normalizedConfiguration = normalizeHandlersConfiguration(configuration);

  router.use(timeoutMiddleware());
  router.use(credentialsFromNotificationMiddleware());
  router.use(haltOnTimedoutMiddleware());
  router.use(clientMiddleware());
  router.use(haltOnTimedoutMiddleware());
  router.use(instrumentationContextMiddleware({ handlerName: "notification" }));
  router.use(fullContextBodyMiddleware({ requestName: "notification" }));
  router.use((req: HullRequestFull, res: $Response, next: NextFunction) => {
    if (
      req.hull.notification &&
      req.hull.notification.channel === "ship:update"
    ) {
      req.hull.cache.del("connector");
    }
    next();
  });
  router.use(processingMiddleware(normalizedConfiguration));
  router.use(instrumentationTransientError());
  router.use(errorMiddleware());
  return router;
}

module.exports = notificationHandlerFactory;
