import { Router } from "express";

import { group } from "../trait";
import responseMiddleware from "./response-middleware";
import requireHullMiddleware from "./require-hull-middleware";

export default function batchHandler(handler, { batchSize = 100, groupTraits = false } = {}) {
  const router = Router();
  router.use(requireHullMiddleware);
  router.post("/", (req, res, next) => {
    const { client } = req.hull;

    return client.handleExtract({
      body: req.body,
      batchSize,
      handler: (users) => {
        const segmentId = req.query.segment_id || null;
        users = users.map(u => client.setUserSegments({ add_segment_ids: [segmentId] }, u));
        users = users.filter(u => client.filterUserSegments(u));
        if (groupTraits) {
          users = users.map(u => group(u));
        }
        return handler(req.hull, users);
      }
    }).then(next, next);
  });
  router.use(responseMiddleware);

  return router;
}
