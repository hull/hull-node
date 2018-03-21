// @flow
const TransientError = require("./transient-error");

/**
 * This error means that 3rd party API resources is out of sync comparing to Hull organization state.
 * @public
 * @memberof Errors
 */
class RecoverableError extends TransientError {
  constructor(message: string, extra: Object) {
    super(message, extra);
    this.name = "RecoverableError"; // compatible with http-errors library
    this.code = "HULL_ERR_RECOVERABLE"; // compatible with internal node error
    Error.captureStackTrace(this, RecoverableError);
  }
}

module.exports = RecoverableError;
