// @flow
/**
 * General utilities
 * @namespace Utils
 * @public
 */
module.exports.staticRouter = require("./static-router");
module.exports.PromiseReuser = require("./promise-reuser");
module.exports.onExit = require("./on-exit");

module.exports.notificationDefaultFlowControl = require("./notification-default-flow-control");
module.exports.NotificationValidator = require("./notification-validator");

module.exports.superagentUrlTemplatePlugin = require("./superagent-url-template-plugin");
module.exports.superagentInstrumentationPlugin = require("./superagent-intrumentation-plugin.js");
module.exports.superagentErrorPlugin = require("./superagent-error-plugin.js");

module.exports.devMode = require("./dev-mode");

module.exports.pipeStreamToPromise = require("./pipe-stream-to-promise");
module.exports.promiseToReadableStream = require("./promise-to-readable-stream");
module.exports.promiseToWritableStream = require("./promise-to-writable-stream");
module.exports.promiseToTransformStream = require("./promise-to-transform-stream");

module.exports.settingsUpdate = require("./settings-update");
module.exports.extractRequest = require("./extract-request");
module.exports.extractStream = require("./extract-stream");
module.exports.ImportS3Stream = require("./import-s3-stream");
