// @flow
import type { $Response, NextFunction } from "express";
import type { HullRequestFull, HullHandlersConfiguration } from "../types";

const _ = require("lodash");
const { Router } = require("express");
const debug = require("debug")("hull-connector:batch-handler");

const { credentialsFromQueryMiddleware, clientMiddleware, timeoutMiddleware, haltOnTimedoutMiddleware, fullContextBodyMiddleware, fullContextFetchMiddleware } = require("../middlewares");
const { normalizeHandlersConfiguration } = require("../utils");

/**
 * [notificationHandlerFactory description]
 * @param  {HullNotificationHandlerConfiguration} configuration: HullNotificationHandlerConfiguration [description]
 * @return {[type]}                [description]
 * @example
 * app.use("/batch", notificationHandler({
 *   "user:update": (ctx, message) => {}
 * }));
 */
function batchExtractHandlerFactory({ HullClient }: Object, configuration: HullHandlersConfiguration): * {
  const router = Router();
  const normalizedConfiguration = normalizeHandlersConfiguration(configuration);
  router.use(timeoutMiddleware());
  router.use(credentialsFromQueryMiddleware()); // parse query
  router.use(haltOnTimedoutMiddleware());
  router.use(clientMiddleware({ HullClient })); // initialize client
  router.use(haltOnTimedoutMiddleware());
  router.use(fullContextBodyMiddleware({ requestName: "batch", strict: false })); // get rest of the context from body
  router.use(fullContextFetchMiddleware({ requestName: "batch" })); // if something is missing at body
  router.use(haltOnTimedoutMiddleware());
  router.use(function batchExtractMiddleware(req: HullRequestFull, res: $Response, next: NextFunction) {
    const { client, helpers } = req.hull;
    if (!req.body || typeof req.body !== "object") {
      return next(new Error("Missing body payload"));
    }

    if (client === undefined || helpers === undefined) {
      return next(new Error("Authorized HullClient is missing"));
    }

    const { body = {} } = req;
    const { url, format, object_type } = body;
    const entityType = object_type === "account_report" ? "account" : "user";
    const channel = `${entityType}:update`;
    if (normalizedConfiguration[channel] === undefined) {
      return next(new Error(`Missing handler for this channel: ${channel}`));
    }
    const { callback, options } = normalizedConfiguration[channel];

    debug("channel", channel);
    debug("entityType", entityType);
    debug("handlerCallback", typeof callback);
    if (!url || !format) {
      return next(new Error("Missing any of required payload parameters: `url`, `format`."));
    }
    req.hull.isBatch = true;
    return helpers
      .handleExtract({
        body,
        batchSize: options.maxSize || 100,
        onResponse: () => res.end("ok"),
        onError: (err) => {
          client.logger.error("connector.batch.error", err.stack);
          res.sendStatus(400);
        },
        handler: (entities) => {
          const segmentId = (req.query && req.query.segment_id) || null;

          const segmentsList = req.hull[`${entityType}sSegments`].map(s => _.pick(s, ["id", "name", "type", "created_at", "updated_at"]));
          const entitySegmentsKey = entityType === "user" ? "segments" : "account_segments";
          const messages = entities.map((entity) => {
            const segmentIds = _.compact(
              _.uniq(_.concat(entity.segment_ids || [], [segmentId]))
            );
            const message = {
              [entityType]: _.omit(entity, "segment_ids"),
              [entitySegmentsKey]: _.compact(
                segmentIds.map(id => _.find(segmentsList, { id }))
              )
            };
            if (entityType === "user") {
              message.user = _.omit(entity, "account");
              message.account = entity.account || {};
            }
            return message;
          });
          // $FlowFixMe
          return callback(req.hull, messages);
        }
      })
      .catch(error => next(error));
  });
  router.use(function batchExtractErrorMiddleware(err: Error, req: HullRequestFull, res: $Response, _next: NextFunction) {
    debug("error", err);
    res.status(500).end("error");
  });
  return router;
}

module.exports = batchExtractHandlerFactory;
