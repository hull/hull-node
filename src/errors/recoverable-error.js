/**
 * This error means that 3rd party API resources is out of sync comparing to Hull organization state.
 */
class RecoverableError extends Error {
  constructor(...params) {
    super(...params);
    this.name = "RecoverableError";
    Error.captureStackTrace(this, RecoverableError);
  }
}

module.exports = RecoverableError;
