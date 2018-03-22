// @flow
const TransientError = require("./transient-error");

/**
 * This is a subclass of TransientError.
 * It have similar nature but it's very common during connector operations so it's treated in a separate class.
 * Usually connector is able to tell more about when exactly the rate limit error will be gone to optimize retry strategy.
 *
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
