// @flow
import type { $Response, NextFunction } from "express";
import type { HullRequestFull } from "../../types";

const debug = require("debug")("hull-connector:batch-handler");
const { TransientError } = require("../../errors");

function batchExtractErrorMiddlewareFactory() {
  return function batchExtractErrorMiddleware(
    err: Error,
    req: HullRequestFull,
    res: $Response,
    next: NextFunction
  ) {
    debug("error", err);
    // if we have transient error
    if (err instanceof TransientError) {
      return res.status(503).end("transient-error");
    }
    // else pass it to the global error middleware
    return next(err);
  };
}

module.exports = batchExtractErrorMiddlewareFactory;
