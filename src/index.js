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
const clientMiddleware = require("./middlewares/client");
const HullConnectorClass = require("./connector/hull-connector");
const handlers = require("./handlers");
const utils = require("./utils");

const boundClientMiddleware = clientMiddleware.bind(undefined, { HullClient });
const boundHullConnector = HullConnectorClass.bind(undefined, { Worker, HullClient });
const boundHandlers = (Object.keys(handlers): Array<string>).reduce((bound: Object, key: string) => {
  bound[key] = handlers[key].bind(undefined, { HullClient });
  return bound;
}, {});

module.exports = {
  Client: HullClient,
  middleware: boundClientMiddleware,
  Connector: boundHullConnector,
  handlers: boundHandlers,
  utils
};
