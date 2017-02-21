import { Router } from "express";
import bodyParser from "body-parser";

import responseMiddleware from "./response-middleware";
import requireHullClient from "./require-hull-client";

export default function batchRouter(callback, chunkSize = 100) {
  const router = Router();
  router.use(bodyParser.json());
  router.use(requireHullClient);
  router.post("/", (req, res, next) => {
    const { agent } = req.hull;
    return agent.handleExtract(req.body, chunkSize, (users) => {
      const segmentId = req.query.segment_id || null;
      users = users.map(u => agent.setUserSegments({ add_segment_ids: [segmentId] }, u));
      users = users.filter(u => agent.filterUserSegments(u));
      return callback(req, users);
    }).then(next, next);
  });
  router.use(responseMiddleware);

  return router;
}
