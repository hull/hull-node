import _ from "lodash";
import crypto from "crypto";
import { Router } from "express";

import responseMiddleware from "./response-middleware";
import requireHullMiddleware from "./require-hull-middleware";
import Batcher from "../infra/batcher";

export default function batcherHandler(handler, { maxSize = 100, throttle = 10000 } = {}) {
  const ns = crypto.randomBytes(64).toString('hex');
  const router = Router();
  router.use(requireHullMiddleware);
  router.post("/", (req, res, next) => {
    const { client } = req.hull;

    Batcher.getHandler(ns, {
      ctx: req.hull,
      options: {
        maxSize: maxSize,
        throttle: throttle
      }
    })
    .setCallback((messages) => {
      return handler(req.hull, messages)
    })
    .addMessage(req.body)
    .then(next, next);
  });
  router.use(responseMiddleware);

  return router;
}
