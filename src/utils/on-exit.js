const debug = require("debug")("hull-connector:on-exit");

/**
 * @param {Promise} promise
 */
function onExit(promise) {
  function exitNow() {
    console.warn("connector.exitHandler.exitNow"); //eslint-disable-line no-console
    process.exit(0);
  }

  function handleExit() {
    const waiting = 30000;
    debug("connector.exitHandler.handleExit", { waiting });
    setTimeout(exitNow, waiting);
    promise().then(exitNow, exitNow);
  }

  process.on("SIGINT", handleExit);
  process.on("SIGTERM", handleExit);
  process.on("gracefulExit", handleExit);
}

module.exports = onExit;
