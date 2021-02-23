// @flow
import type { $Response, NextFunction } from "express";
import type { HullRequestFull, HullHandlersConfigurationEntry } from "../../types";

// type HullRequestsBufferHandlerCallback = (ctx: HullContextFull, requests: Array<{ body: mixed, query: mixed }>) => Promise<*>;
// type HullRequestsBufferHandlerOptions = {
//   maxSize?: number,
//   maxTime?: number,
//   disableErrorHandling?: boolean
// };

const crypto = require("crypto");
const { Router } = require("express");

const { normalizeHandlersConfigurationEntry } = require("../../utils");
const { clientMiddleware, fullContextFetchMiddleware, timeoutMiddleware, haltOnTimedoutMiddleware, instrumentationContextMiddleware } = require("../../middlewares");

const Batcher = require("../../infra/batcher");

/**
 * @param
 * @param {Object|Function} callback         [description]
 * @param {Object}   options [description]
 * @param {number}   options.maxSize [description]
 * @param {number}   options.maxTime [description]
 */
function requestsBufferHandlerFactory(configurationEntry: HullHandlersConfigurationEntry) {
  const { callback, options } = normalizeHandlersConfigurationEntry(configurationEntry);
  const {
    maxSize = 100,
    maxTime = 10000,
    disableErrorHandling = false
  } = options;

  const uniqueNamespace = crypto.randomBytes(64).toString("hex");
  const router = Router();

  router.use(timeoutMiddleware());
  router.use(clientMiddleware()); // initialize client, we need configuration to be set already
  router.use(haltOnTimedoutMiddleware());
  router.use(instrumentationContextMiddleware());
  router.use(fullContextFetchMiddleware({ requestName: "requests-buffer" }));
  router.use(haltOnTimedoutMiddleware());
  router.use(function requestsBufferHandler(req: HullRequestFull, res: $Response, next: NextFunction) {
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
    router.use((err: Error, req: HullRequestFull, res: $Response, _next: NextFunction) => {
      res.status(500).end("error");
    });
  }

  return router;
}

module.exports = requestsBufferHandlerFactory;
