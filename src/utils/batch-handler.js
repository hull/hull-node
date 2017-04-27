import { Router } from "express";
import _ from "lodash";

import { group } from "../trait";
import responseMiddleware from "./response-middleware";
import requireHullMiddleware from "./require-hull-middleware";

/**
 * @deprecated Use `notifyHandler` instead.
 */
export default function batchHandler(handler, { batchSize = 100, groupTraits = false } = {}) {
  const router = Router();
  router.use(requireHullMiddleware());
  router.post("/", (req, res, next) => {
    const { client, segments } = req.hull;

    return client.utils.extract.handle({
      body: req.body,
      batchSize,
      handler: (users) => {
        const segmentId = req.query.segment_id || null;
        if (groupTraits) {
          users = users.map(u => group(u));
        }

        const messages = users.map((u) => {
          const segmentIds = _.uniq(_.concat(u.segment_ids || [], [segmentId]));
          return {
            user: u,
            segments: segmentIds.map(id => _.find(segments, { id }))
          };
        });

        return handler(req.hull, messages, { query: req.query, body: req.body });
      }
    }).then(next, next);
  });
  router.use(responseMiddleware());

  return router;
}
