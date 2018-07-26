const _ = require("lodash");
const debug = require("debug")("hull-connector:middlewares");
const { TransientError } = require("../errors");

function instrumentationTransientErrorFactory() {
  return function instrumentationTransientError(err, req, res, next) {
    if (err instanceof TransientError) {
      debug("transient-error metric");
      req.hull.metric.increment("connector.transient_error", 1, [
        `error_name:${_.snakeCase(err.name)}`,
        `error_message:${_.snakeCase(err.message)}`
      ]);
    }
    next(err);
  };
}


module.exports = instrumentationTransientErrorFactory;
