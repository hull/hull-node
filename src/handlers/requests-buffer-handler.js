// @flow
import type { $Response, NextFunction } from "express";
import type { HullRequest, HullContext } from "../types";

type HullRequestsBufferHandlerCallback = (ctx: HullContext, requests: Array<{ body: mixed, query: mixed }>) => Promise<*>;
type HullRequestsBufferHandlerOptions = {
  maxSize?: number | string,
  maxTime?: number | string,
  disableErrorHandling?: boolean
};

const crypto = require("crypto");
const { Router } = require("express");

const { clientMiddleware, fetchFullContextMiddleware, timeoutMiddleware, haltOnTimedoutMiddleware } = require("../middlewares");

const Batcher = require("../infra/batcher");

/**
 * [batcherHandler description]
 * @param  {Function} callback         [description]
 * @param  {Object} options [description]
 * @param  {number} options.maxSize [description]
 * @param  {number} options.maxTime [description]
 */
function requestsBufferHandlerFactory({ HullClient }: Object, callback: HullRequestsBufferHandlerCallback, { maxSize = 100, maxTime = 10000, disableErrorHandling = false }: HullRequestsBufferHandlerOptions = {}) {
  const uniqueNamespace = crypto.randomBytes(64).toString("hex");
  const router = Router();
  router.use(clientMiddleware({ HullClient })); // initialize client, we need configuration to be set already
  router.use(timeoutMiddleware());
  router.use(fetchFullContextMiddleware({ requestName: "batcher" }));
  router.use(haltOnTimedoutMiddleware());
  router.use(function requestsBufferHandler(req: HullRequest, res: $Response, next: NextFunction) {
    Batcher.getHandler(uniqueNamespace, {
      ctx: req.hull,
      options: {
        maxSize,
        maxTime
      }
    })
    .setCallback((requests) => {
      return callback(req.hull, requests);
    })
    .addMessage({ body: req.body, query: req.query })
    .then(() => {
      res.status(200).end("ok");
    })
    .catch(error => next(error));
  });

  if (disableErrorHandling !== true) {
    router.use((err: Error, req, res: $Response, _next: NextFunction) => {
      res.status(500).end("error");
    });
  }

  return router;
}

module.exports = requestsBufferHandlerFactory;
