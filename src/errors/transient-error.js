// @flow

/**
 * This is a transient error related to either connectivity issues or temporary 3rd party API unavailability.
 *
 * When using `superagentErrorPlugin` it's returned by some errors out-of-the-box.
 *
 * @public
 * @memberof Errors
 */
class TransientError extends Error {
  extra: Object;
  status: number;
  code: string;

  constructor(message: string, extra: Object, status: number = 503) {
    super(message);
    this.name = "TransientError"; // compatible with http-errors library
    this.code = "HULL_ERR_TRANSIENT"; // compatible with internal node error
    this.extra = extra;
    this.status = status;
    Error.captureStackTrace(this, TransientError);
  }
}

module.exports = TransientError;
