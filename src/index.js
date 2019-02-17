/* @flow */

export type * from "./types";
export type * from "hull-client";

const HullClient = require("hull-client");
const Worker = require("./connector/worker");
const HullConnector = require("./connector/hull-connector");
const hullContextMiddleware = require("./middlewares/hull-context-middleware");
const start = require("./start");


const boundHullConnector: Class<HullConnector> = HullConnector.bind(undefined, {
  Worker,
  HullClient,
});


module.exports = {
  hullContextMiddleware,
  start: start(boundHullConnector),
  Connector: boundHullConnector,
  Client: HullClient,
};
