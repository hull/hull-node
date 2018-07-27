// @flow
/* eslint-disable global-require */

/**
 * General utilities
 * @namespace Errors
 * @public
 */
module.exports = {
  ConfigurationError: require("./configuration-error"),
  RateLimitError: require("./rate-limit-error"),
  RecoverableError: require("./recoverable-error"),
  TransientError: require("./transient-error"),
  LogicError: require("./logic-error"),
  NotificationValidationError: require("./notification-validation-error")
};
