import { Router } from "express";
import _ from "lodash";
import { group } from "hull-client/lib/trait";

import requireHullMiddleware from "./require-hull-middleware";

/**
 * @deprecated Use `notifyHandler` instead.
 */
export default function batchHandler(handler, { batchSize = 100, groupTraits = false, segmentFilterSetting } = {}) {
  const router = Router();
  router.use(requireHullMiddleware());
  router.post("/", (req, res) => {
    const { client, segments, helpers, connectorConfig } = req.hull;

    return client.utils.extract.handle({
      body: req.body,
      batchSize,
      onResponse: () => {
        res.end("ok");
      },
      onError: (err) => {
        client.logger.error("batch.error", err.stack);
        res.sendStatus(400);
      },
      handler: (users) => {
        const segmentId = req.query.segment_id || null;
        if (groupTraits) {
          users = users.map(u => group(u));
        }

        const messages = users.map((u) => {
          const segmentIds = _.compact(_.uniq(_.concat(u.segment_ids || [], [segmentId])));
          return {
            user: u,
            segments: segmentIds.map(id => _.find(segments, { id }))
          };
        });

        // add `matchesFilter` boolean flag
        messages.map((m) => {
          if (req.query.source === "connector") {
            m.matchesFilter = helpers.filterNotification(m, segmentFilterSetting || connectorConfig.segmentFilterSetting);
          } else {
            m.matchesFilter = true;
          }
          return m;
        });
        return handler(req.hull, messages);
      }
    });
  });

  return router;
}
