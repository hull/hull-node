// @flow
const HullClient = require("hull-client");
const {
  credentialsFromQueryMiddleware,
  clientMiddleware,
  timeoutMiddleware,
  fullContextFetchMiddleware,
  haltOnTimedoutMiddleware
} = require("../middlewares");

function credsFromQueryFullFetch({ requestName }: { requestName: string } = {}) {
  return [
    credentialsFromQueryMiddleware(),
    clientMiddleware({ HullClient }),
    timeoutMiddleware(),
    fullContextFetchMiddleware({ requestName }),
    haltOnTimedoutMiddleware()
  ];
}

module.exports = credsFromQueryFullFetch;
