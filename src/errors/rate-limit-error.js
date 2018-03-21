// @flow
const TransientError = require("./transient-error");

/**
 * This is a subclass of TransientError.
 * It have similar nature but it's very common during connector
 * operations so it's treated in a separate class.
 * @public
 * @memberof Errors
 */
class RateLimitError extends TransientError {
  constructor(message: string, extra: Object) {
    super(message, extra);
    this.name = "RateLimitError"; // compatible with http-errors library
    this.code = "HULL_ERR_RATE_LIMIT"; // compatible with internal node error
    Error.captureStackTrace(this, RateLimitError);
  }
}

module.exports = RateLimitError;
