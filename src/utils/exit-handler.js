/**
 * @param {Promise} promise
 */
module.exports = function exitHandler(promise) {
  function exitNow() {
    console.warn("connector.exitHandler.exitNow");
    process.exit(0);
  }

  function handleExit() {
    const waiting = 30000;
    console.log("connector.exitHandler.handleExit", { waiting });
    setTimeout(exitNow, waiting);
    promise().then(exitNow, exitNow);
  }

  process.on("SIGINT", handleExit);
  process.on("SIGTERM", handleExit);
  process.on("gracefulExit", handleExit);
};
