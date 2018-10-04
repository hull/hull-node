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
  return ["organization", "id", "secret"].reduce((cfg, k) => {
    const val = (query && typeof query[k] === "string" ? query[k] : "").trim();
    const key = k === "id" ? "id" : k;
    if (typeof val === "string") {
      cfg[key] = val;
    } else if (val && val[0] && typeof val[0] === "string") {
      cfg[key] = val[0].trim();
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

function generateToken(clientCredentials, secret) {
  return jwt.encode(clientCredentials, secret);
}

/**
 * This middleware is responsible for preparing `req.hull.clientCredentials`.
 * If there is already `req.hull.clientCredentials` set before it just skips.
 * Otherwise it tries to parse encrypted token, it search for the token first in `req.hull.clientCredentialsToken`
 * if not available it tries to get the token in `req.query.hullToken`, `req.query.token` or `req.query.state`.
 * If those two steps fails to find information it parse `req.query` looking for direct connector configuration
 */
function credentialsFromQueryMiddleware() {
  return function credentialsFromQuery(
    req: HullRequestBase,
    res: $Response,
    next: NextFunction
  ) {
    try {
      if (!req.hull || !req.hull.connectorConfig) {
        throw new Error(
          "Missing req.hull or req.hull.connectorConfig context object. Did you initialize Hull.Connector() ?"
        );
      }
      const { hostSecret } = req.hull.connectorConfig;
      const clientCredentials =
        req.hull.clientCredentials ||
        parseToken(
          req.hull.clientCredentialsToken || getToken(req.query),
          hostSecret
        ) ||
        parseQueryString(req.query);

      const clientCredentialsToken = generateToken(
        clientCredentials,
        hostSecret
      );

      if (clientCredentials === undefined) {
        return next(new Error("Could not resolve clientCredentials"));
      }
      // handle legacy naming
      if (
        clientCredentials.ship &&
        typeof clientCredentials.ship === "string"
      ) {
        clientCredentials.id = clientCredentials.ship;
        delete clientCredentials.ship;
        debug(
          "You have passed a config parameter called `ship`, which is deprecated. please use `id` instead"
        );
      }
      debug("resolved configuration");
      req.hull = Object.assign(req.hull, {
        clientCredentials,
        clientCredentialsToken
      });
      return next();
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = credentialsFromQueryMiddleware;
