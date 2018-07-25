// @flow
import type { $Response, NextFunction } from "express";
import type { HullRequestFull } from "../../types";

const debug = require("debug")("hull-connector:batch-handler");

function batchExtractErrorMiddlewareFactory() {
  return function batchExtractErrorMiddleware(err: Error, req: HullRequestFull, res: $Response, _next: NextFunction) {
    debug("error", err);
    res.status(500).end("error");
  };
}

module.exports = batchExtractErrorMiddlewareFactory;
