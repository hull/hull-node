/* eslint-disable global-require */
module.exports = {
  ConfigurationError: require("./configuration-error"),
  RateLimitError: require("./rate-limit-error"),
  RecoverableError: require("./recoverable-error"),
  TransientError: require("./transient-error")
};
