/* @flow */
/*:: export type * from "./types"; */

/**
 * An object that's available in all action handlers and routers as `req.hull`.
 * It's a set of parameters and modules to work in the context of current organization and connector instance.
 *
 * @namespace Context
 * @public
 */

const Client = require("hull-client");

const clientMiddleware = require("./middleware/client");
const HullConnector = require("./connector/hull-connector");

module.exports = {
  Client,
  Middleware: clientMiddleware.bind(undefined, Client),
  Connector: HullConnector.bind(undefined, Client)
};
