// @flow

/**
 * This is an error which should be handled by the connector implementation itself.
 *
 * Rejecting or throwing this error without try/catch block will be treated as unhandled error.
 *
 * @public
 * @memberof Errors
 * @example
 * function validationFunction() {
 *   throw new LogicError("Validation error", { action: "validation", payload: });
 * }
 */
class LogicError extends Error {
  action: string;

  payload: any;

  code: string;

  constructor(message: string, action: string, payload: any) {
    super(message);
    this.name = "LogicError"; // compatible with http-errors library
    this.code = "HULL_ERR_LOGIC"; // compatible with internal node error
    this.action = action;
    this.payload = payload;
    Error.captureStackTrace(this, LogicError);
  }
}

module.exports = LogicError;
