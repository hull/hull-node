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
      console.error(err.stack || err);
      return next(err);
    }
  };
}


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
