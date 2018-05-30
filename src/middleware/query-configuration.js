// @flow
import type { $Response, NextFunction } from "express";
import type { HullRequestBase } from "../types";

const jwt = require("jwt-simple");

function getToken(query: $PropertyType<HullRequestBase, 'query'>): string {
  if (query && (query.hullToken || query.token || query.state)) {
    return query.hullToken || query.token || query.state;
  }
  return "";
}

function parseQueryString(query: $PropertyType<HullRequestBase, 'query'>): Object {
  return ["organization", "ship", "secret"].reduce((cfg, k) => {
    const val = (query[k] || "").trim();
    if (typeof val === "string") {
      cfg[k] = val;
    } else if (val && val[0] && typeof val[0] === "string") {
      cfg[k] = val[0].trim();
    }
    return cfg;
  }, {});
}

function parseToken(token, secret) {
  if (!token || !secret) { return false; }
  try {
    const config = jwt.decode(token, secret);
    return config;
  } catch (err) {
    const e = new Error("Invalid Token");
    e.status = 401;
    throw e;
  }
}

/**
 * This middleware is responsible for preparing `req.hull.clientConfig`.
 * If there is already `req.hull.clientConfig` or `req.hull.config` set before it just skips.
 * Otherwise it tries to parse encrypted token, it search for the token first in `req.hull.clientConfigToken`
 * and `req.hull.token`, if not available it tries to get the token in `req.query.hullToken`, `req.query.token` or `req.query.state`.
 * If those two steps fails to find information it parse `req.query` looking for direct connector configuration
 */
function queryConfigurationMiddlewareFactory() {
  return function queryConfigurationMiddleware(req: HullRequestBase, res: $Response, next: NextFunction) {
    const { hostSecret } = req.hull.connectorConfig;
    const clientConfigToken = req.hull.clientConfigToken || req.hull.token || getToken(req.query);
    const clientConfig =
      req.hull.clientConfig ||
      req.hull.config ||
      parseToken(clientConfigToken, hostSecret) ||
      parseQueryString(req.query) ||
      {};
    req.hull = Object.assign({}, req.hull, {
      config: clientConfig,
      token: clientConfigToken,
      clientConfig,
      clientConfigToken
    });
    next();
  };
}

module.exports = queryConfigurationMiddlewareFactory;
