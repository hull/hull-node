const TransientError = require("./transient-error");

/**
 * This is a subclass of TransientError.
 * It have similar nature but it's very common during connector
 * oprations so it's treated in a separate class.
 */
class RateLimitError extends TransientError {
  constructor(...params) {
    super(...params);
    this.name = "RateLimitError";
    Error.captureStackTrace(this, RateLimitError);
  }
}

module.exports = RateLimitError;
