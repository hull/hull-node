const crypto = require("crypto");
const { Router } = require("express");

const { clientMiddleware, fetchFullContextMiddleware, timeoutMiddleware, haltOnTimedoutMiddleware } = require("../middleware");

const Batcher = require("../infra/batcher");

/**
 * [batcherHandler description]
 * @param  {Function} handler         [description]
 * @param  {Object} options [description]
 * @param  {number} options.maxSize [description]
 * @param  {number} options.maxTime [description]
 */
function batcherHandler(handler, { maxSize = 100, maxTime = 10000, disableErrorHandling = false } = {}) {
  const uniqueNamespace = crypto.randomBytes(64).toString("hex");
  const router = Router();
  router.use(clientMiddleware()); // initialize client, we need configuration to be set already
  router.use(timeoutMiddleware());
  router.use(fetchFullContextMiddleware({ requestName: "batcher" }));
  router.use(haltOnTimedoutMiddleware());
  router.use((req, res, next) => {
    Batcher.getHandler(uniqueNamespace, {
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
    .then(() => {
      res.status(200).end("ok");
    })
    .catch(error => next(error));
  });

  if (disableErrorHandling !== true) {
    router.use((err, req, res, _next) => {
      res.status(500).end("error");
    });
  }

  return router;
}

module.exports = batcherHandler;
