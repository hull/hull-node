const _ = require("lodash");
const { Router } = require("express");
const Promise = require("bluebird");

const requireHullMiddleware = require("./require-hull-middleware");

const statusMap = {
  0: "ok",
  1: "warning",
  2: "error"
};

/**
 * @param {Array} checks
 * @example
 * app.use("/status", statusHandler([
 * (ctx) => {
 *   return Promise.resolve({
 *     status: "ok|error|warning",
 *     message: "Error Message"
 *   });
 * }
 * ]));
 */
module.exports = function statusHandler(checks) {
  const router = Router();
  router.use(requireHullMiddleware());
  router.post("/", (req, res) => {
    const messages = [];
    let globalStatus = 0;

    const promises = Promise.mapSeries(checks, (check) => {
      check(req.hull).then(({ status, message }) => {
        messages.push(message);
        const statusNumeric = _.flip(statusMap)[status] || 2;
        globalStatus = Math.min(globalStatus, statusNumeric);
      });
    });

    promises.then(() => {
      res.json({
        messages,
        status: statusMap[globalStatus] || "error"
      });
    }, () => {
      res.status(500).json({
        status: "error"
      });
    });
  });

  return router;
};
