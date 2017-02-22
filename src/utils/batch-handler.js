import { Router } from "express";
import bodyParser from "body-parser";

import responseMiddleware from "./response-middleware";
import requireHullClient from "./require-hull-client";

export default function batchHandler(handler, options = { chunkSize: 100 }) {
  const router = Router();
  router.use(bodyParser.json());
  router.use(requireHullClient);
  router.post("/", (req, res, next) => {
    const { agent } = req.hull;
    return agent.handleExtract(req.body, options.chunkSize, (users) => {
      const segmentId = req.query.segment_id || null;
      users = users.map(u => agent.setUserSegments({ add_segment_ids: [segmentId] }, u));
      users = users.filter(u => agent.filterUserSegments(u));
      return handler(req, users);
    }).then(next, next);
  });
  router.use(responseMiddleware);

  return router;
}
