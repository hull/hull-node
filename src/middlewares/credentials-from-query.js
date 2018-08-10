// @flow
import type { $Response, NextFunction } from "express";
import type { HullRequestBase } from "../types";

const debug = require("debug")("hull-connector:credentials-from-query");
const jwt = require("jwt-simple");

function getToken(query: $PropertyType<HullRequestBase, "query">): string {
  if (query) {
    if (typeof query.hullToken === "string") {
      return query.hullToken;
    }

    if (typeof query.token === "string") {
      return query.token;
    }

    if (typeof query.state === "string") {
      return query.state;
    }
  }
  return "";
}

function parseQueryString(
  query: $PropertyType<HullRequestBase, "query">
): { [string]: string | void } {
  return ["organization", "ship", "secret"].reduce((cfg, k) => {
    const val = (query && typeof query[k] === "string" ? query[k] : "").trim();
    if (typeof val === "string") {
      cfg[k] = val;
    } else if (val && val[0] && typeof val[0] === "string") {
      cfg[k] = val[0].trim();
    }
    return cfg;
  }, {});
}

function parseToken(token, secret) {
  if (!token || !secret) {
    return false;
  }
  try {
    const config = jwt.decode(token, secret);
    return config;
  } catch (err) {
    const e = new Error("Invalid Token");
    // e.status = 401;
    throw e;
  }
}

/**
 * This middleware is responsible for preparing `req.hull.clientCredentials`.
 * If there is already `req.hull.clientCredentials` set before it just skips.
 * Otherwise it tries to parse encrypted token, it search for the token first in `req.hull.clientCredentialsToken`
 * if not available it tries to get the token in `req.query.hullToken`, `req.query.token` or `req.query.state`.
 * If those two steps fails to find information it parse `req.query` looking for direct connector configuration
 */
function credentialsFromQueryMiddlewareFactory() {
  return function credentialsFromQueryMiddleware(
    req: HullRequestBase,
    res: $Response,
    next: NextFunction
  ) {
    try {
      if (!req.hull || !req.hull.connectorConfig) {
        return next(
          new Error(
            "Missing req.hull or req.hull.connectorConfig context object"
          )
        );
      }
      const { hostSecret } = req.hull.connectorConfig;
      const clientCredentialsToken =
        req.hull.clientCredentialsToken || getToken(req.query);
      const clientCredentials =
        req.hull.clientCredentials ||
        parseToken(clientCredentialsToken, hostSecret) ||
        parseQueryString(req.query);

      if (clientCredentials === undefined) {
        return next(new Error("Could not resolve clientCredentials"));
      }
      // handle legacy naming
      if (
        clientCredentials.ship &&
        typeof clientCredentials.ship === "string"
      ) {
        clientCredentials.id = clientCredentials.ship;
      }
      debug("resolved configuration");
      req.hull = Object.assign(req.hull, {
        clientCredentials,
        clientCredentialsToken,
      });
      return next();
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = credentialsFromQueryMiddlewareFactory;
