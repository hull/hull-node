import { Router } from "express";
import bodyParser from "body-parser";

import { handleExtract, setUserSegments, filterUserSegments } from "../hull";
import responseMiddleware from "./response-middleware";
import hullClient from "./hull-middleware";
import tokenMiddleware from "./token-middleware";

export default function batchRouter(callback, chunkSize = 100) {
  const router = Router();
  router.use(bodyParser.json());
  router.post("/", (req, res, next) => {
    const ctx = req.hull
    return handleExtract(ctx, req.body, chunkSize, (users) => {
      const segmentId = req.query.segment_id || null;
      users = users.map(u => setUserSegments(req, { add_segment_ids: [segmentId] }, u));
      users = users.filter(u => filterUserSegments(req, u));
      return callback(req, users);
    }).then(next, next);
  });
  router.use(responseMiddleware);

  return router;
}
