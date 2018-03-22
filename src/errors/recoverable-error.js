// @flow
const TransientError = require("./transient-error");

/**
 * This error means that 3rd party API resources is out of sync comparing to Hull organization state.
 * For example customer by accident removed a resource which we use to express segment information (for example user tags, user sub lists etc.)
 * So this is a TransientError which could be retried after forcing "reconciliation" operation (which should recreate missing resource)
 *
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
