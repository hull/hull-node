// @flow
const HullClient = require("hull-client");
const {
  credentialsFromQueryMiddleware,
  clientMiddleware,
  timeoutMiddleware,
  fullContextBodyMiddleware,
  fullContextFetchMiddleware,
  haltOnTimedoutMiddleware
} = require("../middlewares");

function credsFromQueryMiddlewares({ requestName }: { requestName: string } = {}) {
  return [
    credentialsFromQueryMiddleware(),
    clientMiddleware({ HullClient }),
    timeoutMiddleware(),
    fullContextBodyMiddleware({ requestName, strict: false }), // get rest of the context from body
    fullContextFetchMiddleware({ requestName }), // if something is missing at body
    haltOnTimedoutMiddleware()
  ];
}

module.exports = credsFromQueryMiddlewares;
