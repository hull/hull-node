const TransientError = require("./transient-error");
/**
 * This is an error related to connector configuration.
 */
class ConfigurationError extends TransientError {
  constructor(...params) {
    super(...params);
    this.name = "ConfigurationError";
    Error.captureStackTrace(this, ConfigurationError);
  }
}

module.exports = ConfigurationError;
