import crypto from "crypto";
import { Router } from "express";

import responseMiddleware from "./response-middleware";
import requireHullMiddleware from "./require-hull-middleware";
import Batcher from "../infra/batcher";

export default function batcherHandler(handler, { maxSize = 100, maxTime = 10000 } = {}) {
  const ns = crypto.randomBytes(64).toString("hex");
  const router = Router();
  router.use(requireHullMiddleware());
  router.post("/", (req, res, next) => {
    Batcher.getHandler(ns, {
      ctx: req.hull,
      options: {
        maxSize,
        maxTime
      }
    })
    .setCallback((messages) => {
      return handler(req.hull, messages);
    })
    .addMessage({ body: req.body, query: req.query })
    .then(next, next);
  });
  router.use(responseMiddleware());

  return router;
}
