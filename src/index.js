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

const Worker = require("./connector/worker");
const HullConnector = require("./connector/hull-connector");

const boundHullConnector = HullConnector.bind(undefined, { Worker, HullClient });

module.exports = {
  Connector: boundHullConnector,
  Client: HullClient
};
