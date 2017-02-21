/**
 * @param {Promise} promise
 */
export default function exitHandler(promise) {
  function exitNow() {
    console.warn("exitHandler.exitNow");
    process.exit(0);
  }

  function handleExit() {
    console.log("exitHandler.handleExit");
    setTimeout(exitNow, 30000);
    promise().then(exitNow, exitNow);
  }

  process.on("SIGINT", handleExit);
  process.on("SIGTERM", handleExit);
}
