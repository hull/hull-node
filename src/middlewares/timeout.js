const connectTimeout = require("connect-timeout");
const { TransientError } = require("../errors");

function timeoutMiddlewareFactory({ emitError = true, onTimeout = null } = {}) {
  return function timeoutMiddleware(req, res, next) {
    const { timeout } = req.hull.connectorConfig;
    const originalSend = res.send;
    const originalJson = res.json;
    res.json = function customJson(data) {
      if (res.headersSent) {
        return;
      }
      originalJson.call(res, data);
    };
    res.send = function customSend(data) {
      if (res.headersSent) {
        return;
      }
      originalSend.call(res, data);
    };
    if (onTimeout) {
      req.on("timeout", onTimeout(timeout, next));
    }
    if (emitError) {
      const error = new TransientError("Response timeout");
      req.on("timeout", () => next(error));
    }
    connectTimeout(timeout, { respond: false })(req, res, next);
  };
}

module.exports = timeoutMiddlewareFactory;
