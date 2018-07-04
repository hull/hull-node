// @flow
const HullClient = require("hull-client");
const {
  credentialsFromQueryMiddleware,
  clientMiddleware,
  timeoutMiddleware,
  fullContextBodyMiddleware,
  haltOnTimedoutMiddleware
} = require("../middlewares");

function credsFromQueryFullBody({ requestName }: { requestName: string } = {}) {
  return [
    credentialsFromQueryMiddleware(),
    clientMiddleware({ HullClient }),
    timeoutMiddleware(),
    fullContextBodyMiddleware({ requestName }),
    haltOnTimedoutMiddleware()
  ];
}

module.exports = credsFromQueryFullBody;
