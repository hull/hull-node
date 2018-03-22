const express = require("express");
const requireHullMiddleware = require("./require-hull-middleware");
const handleExtractFactory = require("./extract-handler-factory");
const { SmartNotifierError } = require("./smart-notifier-response");

const { defaultSuccessFlowControl, defaultErrorFlowControl, unsupportedChannelFlowControl } = require("./smart-notifier-flow-controls");

function processHandlersFactory(handlers, userHandlerOptions) {
  return function process(req, res, next) {
    try {
      const { notification, client, helpers } = req.hull;
      if (!notification || !notification.notification_id) {
        return next();
      }
      client.logger.debug("connector.smartNotifierHandler.process", {
        notification_id: notification.notification_id,
        channel: notification.channel,
        messages_count: notification.messages.length
      });
      const eventName = notification.channel;
      const messageHandler = handlers[eventName];
      const ctx = req.hull;

      // if we are dealing with `ship:update` notification
      // we clean the underlying cache
      if (notification.channel === "ship:update") {
        req.hull.cache.del(req.hull.ship.id);
      }

      if (!messageHandler) {
        // FIXME: this is a notification the connector is apparently not interested in,
        // for now we default to the "success" response to keep smart-notifier work smoothly
        req.hull.smartNotifierResponse.setFlowControl(unsupportedChannelFlowControl);
        const response = req.hull.smartNotifierResponse.toJSON();
        ctx.client.logger.debug("connector.smartNotifierHandler.response", response);
        return res.json(response);
      }

      if (notification.channel === "user:update") {
        // optionally group user traits
        if (notification.messages && userHandlerOptions.groupTraits) {
          notification.messages = notification.messages.map((message) => {
            message.user = client.utils.traits.group(message.user);
            return message;
          });
        }
      }

      // add `matchesFilter` boolean flag
      notification.messages.map((m) => {
        if (req.query.source === "connector") {
          m.matchesFilter = helpers.filterNotification(m, userHandlerOptions.segmentFilterSetting || req.hull.connectorConfig.segmentFilterSetting);
        } else {
          m.matchesFilter = true;
        }
        return m;
      });

      const promise = messageHandler(ctx, notification.messages);
      return promise.then(() => {
        if (!req.hull.smartNotifierResponse.isValid()) {
          ctx.client.logger.debug("connector.smartNotifierHandler.responseInvalid", req.hull.smartNotifierResponse.toJSON());
          req.hull.smartNotifierResponse.setFlowControl(defaultSuccessFlowControl);
        }
        const response = req.hull.smartNotifierResponse.toJSON();
        ctx.client.logger.debug("connector.smartNotifierHandler.response", response);
        return res.json(response);
      }, (err) => {
        // we enrich the response with the underlying error
        req.hull.smartNotifierResponse.addError(new SmartNotifierError("N/A", err.message));

        // if (!req.hull.smartNotifierResponse.isValid()) {
          // ctx.client.logger.debug("connector.smartNotifierHandler.responseInvalid", req.hull.smartNotifierResponse.toJSON());
        req.hull.smartNotifierResponse.setFlowControl(defaultErrorFlowControl);
        // }
        err = err || new Error("Error while processing notification");
        return next(err);
      });
    } catch (err) {
      err.status = 500;
      req.hull.smartNotifierResponse.setFlowControl(defaultErrorFlowControl);
      return next(err);
    }
  };
}

/**
 * `smartNotifierHandler` is a next generation `notifHandler` cooperating with our internal notification tool. It handles Backpressure, throttling and retries for you and lets you adapt to any external rate limiting pattern.
 *
 * > To enable the smartNotifier for a connector, the `smart-notifier` tag should be present in `manifest.json` file. Otherwise, regular, unthrottled notifications will be sent without the possibility of flow control.
 *
 * ```json
 * {
 *   "tags": ["smart-notifier"],
 *   "subscriptions": [
 *     {
 *       "url": "/notify"
 *     }
 *   ]
 * }
 * ```
 *
 * When performing operations on notification you can set FlowControl settings using `ctx.smartNotifierResponse` helper.
 *
 * @name smartNotifierHandler
 * @public
 * @memberof Utils
 * @param  {Object}  params
 * @param  {Object}  params.handlers
 * @param  {Object}  [param.options]
 * @param  {number}  [param.options.maxSize] the size of users/account batch chunk
 * @param  {number}  [param.options.maxTime] time waited to capture users/account up to maxSize
 * @param  {string}  [params.options.segmentFilterSetting] setting from connector's private_settings to mark users as whitelisted
 * @param  {boolean} [param.options.groupTraits=false]
 * @param  {Object}  [param.userHandlerOptions] deprecated
 * @return {Function} expressjs router
 * @example
 * const { smartNotifierHandler } = require("hull/lib/utils");
 * const app = express();
 *
 * const handler = smartNotifierHandler({
 *   handlers: {
 *     'ship:update': function(ctx, messages = []) {},
 *     'segment:update': function(ctx, messages = []) {},
 *     'segment:delete': function(ctx, messages = []) {},
 *     'account:update': function(ctx, messages = []) {},
 *     'user:update': function(ctx, messages = []) {
 *       console.log('Event Handler here', ctx, messages);
 *       // ctx: Context Object
 *       // messages: [{
 *       //   user: { id: '123', ... },
 *       //   segments: [{}],
 *       //   changes: {},
 *       //   events: [{}, {}]
 *       //   matchesFilter: true | false
 *       // }]
 *       // more about `smartNotifierResponse` below
 *       ctx.smartNotifierResponse.setFlowControl({
 *         type: 'next',
 *         size: 100,
 *         in: 5000
 *       });
 *       return Promise.resolve();
 *     }
 *   },
 *   options: {
 *     groupTraits: false
 *   }
 * });
 *
 * connector.setupApp(app);
 * app.use('/notify', handler);
 */
module.exports = function smartNotifierHandler({ handlers = {}, options = {}, userHandlerOptions = {} }) {
  const app = express.Router();
  app.use(handleExtractFactory({ handlers, options }));
  app.use((req, res, next) => {
    if (!req.hull.notification) {
      return next(new SmartNotifierError("MISSING_NOTIFICATION", "Missing notification object"));
    }
    return next();
  });
  app.use(requireHullMiddleware());
  app.use(processHandlersFactory(handlers, options));

  return app;
};
