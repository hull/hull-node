/* @flow */
export /*:: type */ * from "./types";
export /*:: type */ * from "hull-client";

const HullClient = require("hull-client");

const Worker = require("./connector/worker");
const HullConnector = require("./connector/hull-connector");

const boundHullConnector = HullConnector.bind(undefined, { Worker, HullClient });

module.exports = {
  Connector: boundHullConnector,
  Client: HullClient
};
