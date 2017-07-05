import crypto from "crypto";
import express from "express";
import https from "https";
import _ from "lodash";
import requireHullMiddleware from "./require-hull-middleware";
import Batcher from "../infra/batcher";
import { group } from "../trait";

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

function processHandlersFactory(handlers, userHandlerOptions = {}) {
  const ns = crypto.randomBytes(64).toString("hex");
  return function process(req, res, next) {
    try {
      const { message, notification, helpers, connectorConfig = {} } = req.hull;
      const eventName = getHandlerName(message.Subject);
      const messageHandlers = handlers[eventName];
      const processing = [];

      const ctx = req.hull;

      if (messageHandlers && messageHandlers.length > 0) {
        if (message.Subject === "user_report:update") {
          // optionally group user traits
          if (notification.message && notification.message.user && userHandlerOptions.groupTraits) {
            notification.message.user = group(notification.message.user);
          }
          // add `matchesFilter` boolean flag
          notification.message.matchesFilter = helpers.filterNotification(notification.message, userHandlerOptions.segmentFilterSetting || connectorConfig.segmentFilterSetting);
          processing.push(Promise.all(messageHandlers.map((handler, i) => {
            return Batcher.getHandler(`${ns}-${eventName}-${i}`, {
              ctx,
              options: {
                maxSize: userHandlerOptions.maxSize || 100,
                maxTime: userHandlerOptions.maxTime || 10000
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
          ctx.client.logger.error("notifHandler.err", err.stack || err);
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

function handleExtractFactory({ handlers, userHandlerOptions }) {
  return function handleExtract(req, res, next) {
    if (!req.body || !req.body.url || !req.body.format || !handlers["user:update"]) {
      return next();
    }

    const { client, helpers } = req.hull;
    return client.utils.extract.handle({
      body: req.body,
      batchSize: userHandlerOptions.maxSize || 100,
      handler: (users) => {
        const segmentId = req.query.segment_id || null;
        if (userHandlerOptions.groupTraits) {
          users = users.map(u => group(u));
        }
        const messages = users.map((user) => {
          const segmentIds = _.compact(_.uniq(_.concat(user.segment_ids || [], [segmentId])));
          return {
            user,
            segments: _.compact(segmentIds.map(id => _.find(req.hull.segments, { id })))
          };
        });

        // add `matchesFilter` boolean flag
        messages.map((m) => {
          if (req.query.source === "connector") {
            m.matchesFilter = helpers.filterNotification(m, userHandlerOptions.segmentFilterSetting || req.hull.connectorConfig.segmentFilterSetting);
          } else {
            m.matchesFilter = true;
          }
          return m;
        });
        return handlers["user:update"](req.hull, messages);
      }
    }).then(() => {
      res.end("ok");
    }, (err) => {
      res.end("err");
      client.logger.error("notifHandler.batch.err", err.stack || err);
    });
  };
}


module.exports = function notifHandler({ handlers = {}, onSubscribe, userHandlerOptions = {} }) {
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

  app.use(handleExtractFactory({ handlers, userHandlerOptions }));
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
  app.use(processHandlersFactory(_handlers, userHandlerOptions));
  app.use((req, res) => { res.end("ok"); });

  app.addEventHandler = addEventHandler;
  return app;
};
