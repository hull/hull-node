// @flow
const TransientError = require("./transient-error");

/**
 * This is an error related to connector configuration.
 * @public
 * @memberof Errors
 */
class ConfigurationError extends TransientError {
  constructor(message: string, extra: Object) {
    super(message, extra);
    this.name = "ConfigurationError"; // compatible with http-errors library
    this.code = "HULL_ERR_CONFIGURATION"; // compatible with internal node error
    Error.captureStackTrace(this, ConfigurationError);
  }
}

module.exports = ConfigurationError;
