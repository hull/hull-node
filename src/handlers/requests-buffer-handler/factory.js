// @flow
import type { $Response, NextFunction } from "express";
import type {
  HullRequestFull,
  // HullContextFull,
  HullBatchHandlerConfigurationEntry
} from "../../types";

// type HullRequestsBufferHandlerCallback = (ctx: HullContextFull, requests: Array<{ body: mixed, query: mixed }>) => Promise<*>;
// type HullRequestsBufferHandlerOptions = {
//   maxSize?: number,
//   maxTime?: number,
//   disableErrorHandling?: boolean
// };

const crypto = require("crypto");
const express = require("express");

const {
  clientMiddleware,
  fullContextFetchMiddleware,
  timeoutMiddleware,
  haltOnTimedoutMiddleware,
  instrumentationContextMiddleware
} = require("../../middlewares");

const Batcher = require("../../infra/batcher");

// /**
//  * @param
//  * @param {Object|Function} callback [description]
//  * @param {Object}   options         [description]
//  * @param {number}   options.maxSize [description]
//  * @param {number}   options.maxTime [description]
//  */
function requestsBufferHandlerFactory({
  callback,
  options = {}
}: HullBatchHandlerConfigurationEntry) {
  const {
    maxSize = 100,
    maxTime = 10000,
    disableErrorHandling = false
  } = options;

  const uniqueNamespace = crypto.randomBytes(64).toString("hex");
  const router = express.Router(); //eslint-disable-line new-cap

  router.use(timeoutMiddleware());
  router.use(clientMiddleware()); // initialize client, we need configuration to be set already
  router.use(haltOnTimedoutMiddleware());
  router.use(instrumentationContextMiddleware());
  router.use(fullContextFetchMiddleware({ requestName: "requests-buffer" }));
  router.use(haltOnTimedoutMiddleware());
  router.use((req: HullRequestFull, res: $Response, next: NextFunction) => {
    Batcher.getHandler(uniqueNamespace, {
      ctx: req.hull,
      options: {
        maxSize,
        maxTime
      }
    })
      .setCallback(requests => callback(req.hull, requests))
      .addMessage({ body: req.body, query: req.query })
      .then(
        () => {
          res.status(200).end("ok");
        },
        error => next(error)
      );
  });

  if (disableErrorHandling !== true) {
    router.use((
      err: Error,
      req: HullRequestFull,
      res: $Response,
      _next: NextFunction // eslint-disable-line no-unused-vars
    ) => {
      res.status(500).end("error");
    });
  }

  return router;
}

module.exports = requestsBufferHandlerFactory;
