import _ from "lodash";
import { Router } from "express";
import Promise from "bluebird";

import responseMiddleware from "./response-middleware";
import requireHullMiddleware from "./require-hull-middleware";

export default function actionHandler(handler) {
  const router = Router();
  router.use(requireHullMiddleware);
  router.post("/", (req, res, next) => {
    const { client } = req.hull;
    return Promise.resolve(handler(req.hull, _.pick(req, ["body", "query"]))).then(next, next);
  });
  router.use(responseMiddleware);

  return router;
}
