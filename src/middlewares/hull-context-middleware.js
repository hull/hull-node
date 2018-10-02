// @flow
const credentialsFromQueryMiddleware = require("./credentials-from-query");
const clientMiddleware = require("./client");
const timeoutMiddleware = require("./timeout");
const fullContextFetchMiddleware = require("./full-context-fetch");
const haltOnTimedoutMiddleware = require("./halt-on-timedout");
const compose = require('compose-middleware').errors;
// const debug = require("debug")("hull-connector:credsFromQueryMiddlewares");
import type { Middleware } from "express";

function hullContextMiddleware({
  requestName,
}: { requestName?: string } = {}): Middleware {
  return compose(
    credentialsFromQueryMiddleware(),
    clientMiddleware(),
    timeoutMiddleware(),
    fullContextFetchMiddleware({ requestName }), // if something is missing at body
    haltOnTimedoutMiddleware(),
  );
}

module.exports = hullContextMiddleware;
