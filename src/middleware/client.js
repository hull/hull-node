// @flow
import type { $Response, NextFunction } from "express";
import type { HullRequestBase } from "../types";

const _ = require("lodash");
const jwt = require("jwt-simple");
const HullClient = require("hull-client");
const helperFunctions = require("../helpers");

/**
 * This middleware initiates client and helpers,
 * it depends on `req.hull.clientConfig` or `req.hull.config`
 * available already in the request object.
 */
function clientMiddlewareFactory() {
  return function clientMiddleware(req: HullRequestBase, res: $Response, next: NextFunction) {
    try {
      if (!req.hull) {
        throw new Error("Missing request context, you need to initiate it before");
      }
      if (!req.hull.clientConfig && !req.hull.config) {
        throw new Error("Missing clientConfig");
      }
      if (!req.hull.connectorConfig || !req.hull.connectorConfig.hostSecret) {
        throw new Error("Missing connectorConfig.hostSecret");
      }
      const { hostSecret } = req.hull.connectorConfig;

      const config = req.hull.clientConfig || req.hull.config;
      const client = new HullClient(config);
      const helpers = _.mapValues(helperFunctions, func => func.bind(null, req.hull));
      const token = jwt.encode(req.hull.clientConfig, hostSecret);
      req.hull = Object.assign({}, req.hull, {
        client,
        helpers,
        token
      });
      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = clientMiddlewareFactory;
