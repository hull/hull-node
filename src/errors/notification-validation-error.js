// @flow
class NotificationValidationError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
    Error.captureStackTrace(this, NotificationValidationError);
  }
}
module.exports = NotificationValidationError;
