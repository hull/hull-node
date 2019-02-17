// @flow
import type { $Response, NextFunction } from "express";
import type {
  HullRequestFull,
  HullBatchHandlersConfiguration
} from "../../types";

const _ = require("lodash");
const debug = require("debug")("hull-connector:batch-handler");

const extractStream = require("../../utils/extract-stream");

function batchExtractProcessingMiddlewareFactory(
  configuration: HullBatchHandlersConfiguration
) {
  return function batchExtractProcessingMiddleware(
    req: HullRequestFull,
    res: $Response,
    next: NextFunction
  ) {
    const { client } = req.hull;
    if (!req.body || typeof req.body !== "object") {
      return next(new Error("Missing body payload"));
    }

    if (client === undefined) {
      return next(new Error("Authorized HullClient is missing"));
    }

    const { body = {} } = req;
    const { url, format, object_type } = body;
    const entityType = object_type === "account_report" ? "account" : "user";
    const channel = `${entityType}:update`;
    if (configuration[channel] === undefined) {
      return next(new Error(`Missing handler for this channel: ${channel}`));
    }
    const { callback, options = {} } = configuration[channel];

    debug("channel", channel);
    debug("entityType", entityType);
    debug("handlerCallback", typeof callback);
    if (!url || !format) {
      return next(
        new Error(
          "Missing any of required payload parameters: `url`, `format`."
        )
      );
    }
    req.hull.isBatch = true;
    return extractStream({
      body,
      batchSize: options.maxSize || 100,
      onResponse: () => res.end("ok"),
      onError: err => {
        client.logger.error("connector.batch.error", err.stack);
        res.sendStatus(400);
      },
      callback: entities => {
        const segmentId = (req.query && req.query.segment_id) || null;

        const segmentsList = req.hull[`${entityType}sSegments`].map(s =>
          _.pick(s, ["id", "name", "type", "created_at", "updated_at"])
        );
        const entitySegmentsKey =
          entityType === "user" ? "segments" : "account_segments";
        const messages = entities.map(entity => {
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
    }).catch(error => next(error));
  };
}

module.exports = batchExtractProcessingMiddlewareFactory;
