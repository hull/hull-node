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

function processHandlersFactory(handlers, userHandlerOptions) {
  const ns = crypto.randomBytes(64).toString("hex");
  return function process(req, res, next) {
    try {
      const { message, notification } = req.hull;
      const eventName = getHandlerName(message.Subject);
      const messageHandlers = handlers[eventName];
      const processing = [];

      const context = req.hull;

      if (messageHandlers && messageHandlers.length > 0) {
        if (message.Subject === "user_report:update") {
          // set `segment_ids` and `remove_segment_ids` on the user
          const { left = [] } = _.get(notification, "message.changes.segments", {});
          notification.message.user = context.helpers.setUserSegments({
            add_segment_ids: notification.message.segments.map(s => s.id),
            remove_segment_ids: left.map(s => s.id)
          }, notification.message.user);

          // optionally group user traits
          if (notification.message && notification.message.user && userHandlerOptions.groupTraits) {
            notification.message.user = group(notification.message.user);
          }

          // if the user matches the filter segments
          if (context.helpers.filterUserSegments(notification.message.user)) {
            processing.push(Promise.all(messageHandlers.map((handler, i) => {
              return Batcher.getHandler(`${ns}-${eventName}-${i}`, {
                ctx: context,
                options: {
                  maxSize: userHandlerOptions.maxSize || 100,
                  maxTime: userHandlerOptions.maxTime || 10000
                }
              })
              .setCallback((messages) => {
                return handler(context, messages);
              })
              .addMessage(notification.message);
            })));
          }
        } else {
          processing.push(Promise.all(messageHandlers.map((handler) => {
            return handler(context, notification.message);
          })));
        }
      }

      if (processing.length > 0) {
        Promise.all(processing).then(() => {
          next();
        }, (err) => {
          err.status = err.status || 400;
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
        users = users.map(u => helpers.setUserSegments({ add_segment_ids: [segmentId] }, u));
        if (userHandlerOptions.groupTraits) {
          users = users.map(u => group(u));
        }
        const messages = users.map((user) => {
          return {
            user,
            segments: user.segment_ids.map(id => _.find(req.hull.segments, { id })),
            events: [],
            changes: {
              user: {},
              segments: {
                left: [],
                entered: []
              }
            }
          };
        });
        return handlers["user:update"](req.hull, messages, { query: req.query, body: req.body });
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
