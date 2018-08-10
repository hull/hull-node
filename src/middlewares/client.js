// @flow
import type { $Response, NextFunction } from "express";
import type { HullRequestWithCredentials } from "../types";

const debug = require("debug")("hull-connector:client-middleware");
const jwt = require("jwt-simple");
const HullClient = require("hull-client");

/**
 * This middleware initiates client and helpers,
 * it depends on `req.hull.clientConfig` or `req.hull.config` (legacy naming) parameters available already in the request object.
 * @example
 * const { clientMiddleware } = require("hull/lib/middlewares");
 * const app = express();
 * app.use((req, res, next) => {
 *   // prepare req.hull
 *   req.hull = {
 *     clientConfig: {
 *       id: "connectorId",
 *       secret: "connectorSecret",
 *       organization: "organizationUrl"
 *     }
 *   };
 *   next()
 * });
 * app.use(clientMiddleware());
 * app.post("/endpoint", (req, res) => {
 *   req.hull.client.get("app")
 *     .then(connector => req.end("ok"));
 * });
 */
function clientMiddlewareFactory() {
  return function clientMiddleware(
    req: HullRequestWithCredentials,
    res: $Response,
    next: NextFunction
  ) {
    try {
      if (!req.hull) {
        throw new Error(
          "Missing request context, you need to initiate it before"
        );
      }
      if (!req.hull.connectorConfig || !req.hull.connectorConfig.hostSecret) {
        throw new Error("Missing connectorConfig.hostSecret");
      }
      if (!req.hull.clientCredentials) {
        throw new Error("Missing clientCredentials");
      }
      const HullClientClass = req.hull.HullClient || HullClient;

      const { hostSecret } = req.hull.connectorConfig;
      const mergedClientConfig = Object.assign(
        {},
        req.hull.clientConfig || {},
        req.hull.clientCredentials,
        { requestId: req.hull.requestId }
      );
      debug("configuration %o", mergedClientConfig);
      const client = new HullClientClass(mergedClientConfig);
      const clientCredentialsToken = jwt.encode(
        req.hull.clientCredentials,
        hostSecret
      );
      // $FlowFixMe
      req.hull = Object.assign(req.hull, {
        client,
        clientCredentialsToken,
      });
      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = clientMiddlewareFactory;
