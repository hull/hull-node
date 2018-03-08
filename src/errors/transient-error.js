/**
 * This is a transient error related to either connectivity issues or temporary 3rd party API unavailability.
 */
class TransientError extends Error {
  constructor(...params) {
    super(...params);
    this.name = "TransientError";
    Error.captureStackTrace(this, TransientError);
  }
}

module.exports = TransientError;
