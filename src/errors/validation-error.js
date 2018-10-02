// @flow

class ValidationError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string, status: number = 500) {
    super(message);
    this.code = code;
    this.status = status;
    Error.captureStackTrace(this, ValidationError);
  }
}
module.exports = ValidationError;
