const crypto = require("crypto");
const express = require("express");
const https = require("https");
const _ = require("lodash");
const requireHullMiddleware = require("./require-hull-middleware");
const handleExtractFactory = require("./extract-handler-factory");
const Batcher = require("../infra/batcher");

function subscribeFactory(options) {
  return function subscribe(req, res, next) {
    const { message } = req.hull;

    if (message.Type !== "SubscriptionConfirmation") {
      return next();
    }

    return https.get(message.SubscribeURL, () => {
      if (typeof options.onSubscribe === "function") {
        options.onSubscribe(req);
      }
      return res.end("subscribed");
    }, () => {
      const e = new Error("Failed to subscribe");
      e.status = 400;
      return next(e);
    });
  };
}

function getHandlerName(eventName) {
  const ModelsMapping = {
    user_report: "user",
    users_segment: "segment"
  };
  const [modelName, action] = eventName.split(":");
  const model = ModelsMapping[modelName] || modelName;
  return `${model}:${action}`;
}

function processHandlersFactory(handlers, options = {}) {
  const ns = crypto.randomBytes(64).toString("hex");
  return function process(req, res, next) {
    try {
      const { message, notification, client, helpers, connectorConfig = {} } = req.hull;
      const eventName = getHandlerName(message.Subject);
      const messageHandlers = handlers[eventName];
      const processing = [];

      const ctx = req.hull;

      if (messageHandlers && messageHandlers.length > 0) {
        if (message.Subject === "user_report:update") {
          // optionally group user traits
          if (notification.message && notification.message.user && options.groupTraits) {
            notification.message.user = client.utils.traits.group(notification.message.user);
          }
          // add `matchesFilter` boolean flag
          notification.message.matchesFilter = helpers.filterNotification(notification.message, options.segmentFilterSetting || connectorConfig.segmentFilterSetting);
          processing.push(Promise.all(messageHandlers.map((handler, i) => {
            return Batcher.getHandler(`${ns}-${eventName}-${i}`, {
              ctx,
              options: {
                maxSize: options.maxSize || 100,
                maxTime: options.maxTime || 10000
              }
            })
            .setCallback((messages) => {
              return handler(ctx, messages);
            })
            .addMessage(notification.message);
          })));
        } else {
          processing.push(Promise.all(messageHandlers.map((handler) => {
            return handler(ctx, notification.message);
          })));
        }
      }

      if (processing.length > 0) {
        Promise.all(processing).then(() => {
          next();
        }, (err) => {
          err = err || new Error("Error while processing notification");
          err.eventName = eventName;
          err.status = err.status || 400;
          ctx.client.logger.error("connector.notificationHandler.error", err.stack || err);
          return next(err);
        });
      }
      return next();
    } catch (err) {
      err.status = 400;
      return next(err);
    }
  };
}

/**
 * NotifHandler is a packaged solution to receive User and Segment Notifications from Hull. It's built to be used as an express route. Hull will receive notifications if your ship's `manifest.json` exposes a `subscriptions` key:
 *
 * **Note** : The Smart notifier is the newer, more powerful way to handle data flows. We recommend using it instead of the NotifHandler. This handler is there to support Batch extracts.
 *
 *```json
 * {
 *   "subscriptions": [{ "url": "/notify" }]
 * }
 * ```
 *
 * @name notifHandler
 * @public
 * @memberof Utils
 * @param  {Object}   params
 * @param  {Object}   params.handlers
 * @param  {Function} [params.onSubscribe]
 * @param  {Object}   [params.options]
 * @param  {number}   [params.options.maxSize] the size of users/account batch chunk
 * @param  {number}   [params.options.maxTime] time waited to capture users/account up to maxSize
 * @param  {string}   [params.options.segmentFilterSetting] setting from connector's private_settings to mark users as whitelisted
 * @param  {boolean}  [params.options.groupTraits=false]
 * @param  {Object}   [params.userHandlerOptions] deprecated
 * @return {Function} expressjs router
 * @example
 * import { notifHandler } from "hull/lib/utils";
 * const app = express();
 *
 * const handler = NotifHandler({
 *   options: {
 *     groupTraits: true, // groups traits as in below examples
 *     maxSize: 6,
 *     maxTime: 10000,
 *     segmentFilterSetting: "synchronized_segments"
 *   },
 *   onSubscribe() {} // called when a new subscription is installed
 *   handlers: {
 *     "ship:update": function(ctx, message) {},
 *     "segment:update": function(ctx, message) {},
 *     "segment:delete": function(ctx, message) {},
 *     "account:update": function(ctx, message) {},
 *     "user:update": function(ctx, messages = []) {
 *       console.log('Event Handler here', ctx, messages);
 *       // ctx: Context Object
 *       // messages: [{
 *       //   user: { id: '123', ... },
 *       //   segments: [{}],
 *       //   changes: {},
 *       //   events: [{}, {}]
 *       //   matchesFilter: true | false
 *       // }]
 *     }
 *   }
 * })
 *
 * connector.setupApp(app);
 * app.use('/notify', handler);
 */
module.exports = function notifHandler({ handlers = {}, onSubscribe, userHandlerOptions, options }) {
  if (userHandlerOptions) {
    console.warn("deprecation: userHandlerOptions has been deprecated in favor of options in notifHandler params. This will be a breaking change in 0.14.x");
  }

  const _options = options || userHandlerOptions || {};
  const _handlers = {};
  const app = express.Router();

  function addEventHandler(evt, fn) {
    const eventName = getHandlerName(evt);
    _handlers[eventName] = _handlers[eventName] || [];
    _handlers[eventName].push(fn);
    return this;
  }

  function addEventHandlers(eventsHash) {
    _.map(eventsHash, (fn, eventName) => addEventHandler(eventName, fn));
    return this;
  }

  if (handlers) {
    addEventHandlers(handlers);
  }

  app.use(handleExtractFactory({ handlers, options: _options }));
  app.use((req, res, next) => {
    if (!req.hull.message) {
      const e = new Error("Empty Message");
      e.status = 400;
      return next(e);
    }
    return next();
  });
  app.use(requireHullMiddleware());
  app.use(subscribeFactory({ onSubscribe }));
  app.use(processHandlersFactory(_handlers, _options));
  app.use((req, res) => { res.end("ok"); });

  app.addEventHandler = addEventHandler;
  return app;
};
