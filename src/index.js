/* @flow */
/*:: export type * from "./types"; */
/*:: export type * from "hull-client"; */

/**
 * An object that's available in all action handlers and routers as `req.hull`.
 * It's a set of parameters and modules to work in the context of current organization and connector instance.
 *
 * @namespace Context
 * @public
 */

const HullClient = require("hull-client");

const clientMiddleware = require("./middleware/client");
const HullConnector = require("./connector/hull-connector");

const boundClientMiddleware = clientMiddleware.bind(undefined, HullClient);

module.exports = {
  Client: HullClient,
  Middleware: boundClientMiddleware,
  Connector: HullConnector.bind(undefined, HullClient, boundClientMiddleware)
};
