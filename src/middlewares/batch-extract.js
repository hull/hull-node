// // @flow
// import type { $Response, NextFunction } from "express";
// import type { HullRequest, HullNotificationHandlerCallback, HullNotificationHandlerConfiguration } from "../types";

// const _ = require("lodash");

// function batchExtractMiddlewareFactory(handlers: HullNotificationHandlerConfiguration, options: Object) {
//   return function batchExtractMiddleware(req: HullRequest, res: $Response, next: NextFunction) {
//     if (!req.body) return next();

//     const { body = {} } = req;
//     const { url, format, object_type } = body;
//     const entityType = object_type === "account_report" ? "account" : "user";
//     const handlerName = `${entityType}:update`;
//     const handlerFunction = handlers[handlerName];

//     if (!url || !format || !handlerFunction) {
//       return next();
//     }

//     const { client, helpers } = req.hull;

//     return helpers
//       .handleExtract({
//         body,
//         batchSize: options.maxSize || 100,
//         onResponse: () => res.end("ok"),
//         onError: (err) => {
//           client.logger.error("connector.batch.error", err.stack);
//           res.sendStatus(400);
//         },
//         handler: (entities) => {
//           const segmentId = req.query.segment_id || null;

//           const segmentsList = req.hull[`${entityType}s_segments`].map(s => _.pick(s, ["id", "name", "type", "created_at", "updated_at"]));
//           const entitySegmentsKey = entityType === "user" ? "segments" : "account_segments";
//           const messages = entities.map((entity) => {
//             const segmentIds = _.compact(
//               _.uniq(_.concat(entity.segment_ids || [], [segmentId]))
//             );
//             const message = {
//               [entityType]: _.omit(entity, "segment_ids"),
//               [entitySegmentsKey]: _.compact(
//                 segmentIds.map(id => _.find(segmentsList, { id }))
//               )
//             };
//             if (entityType === "user") {
//               message.user = _.omit(entity, "account");
//               message.account = entity.account || {};
//             }
//             return message;
//           });

//           return handlerFunction(req.hull, messages);
//         }
//       })
//       .catch((err) => {
//         client.logger.error("connector.batch.error", { body, error: _.get(err, "stack", err) });
//       });
//   };
// }

// module.exports = batchExtractMiddleware;
