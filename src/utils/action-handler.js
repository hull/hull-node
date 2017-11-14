const _ = require("lodash");
const { Router } = require("express");
const Promise = require("bluebird");

const responseMiddleware = require("./response-middleware");
const requireHullMiddleware = require("./require-hull-middleware");

module.exports = function actionHandler(handler) {
  const router = Router();
  router.use(requireHullMiddleware());
  router.post("/", (req, res, next) => {
    return Promise.resolve(handler(req.hull, _.pick(req, ["body", "query"]))).then(next, next);
  });
  router.use(responseMiddleware());

  return router;
};
