import bodyParser from "body-parser";

/**
 * @param  {Object}   req
 * @param  {Object}   res
 * @param  {Function} next
 */
export default function smartNotifierMiddlewareFactory() {
  return function notifMiddleware(req, res, next) {
    req.hull = req.hull || {};

    if (!req.headers["x-hull-smart-notifier"]) {
      return next();
    }
    // TODO: add signature verification
    return bodyParser.json({ limit: "10mb" })(req, res, () => {
      req.hull.notification = req.body;
      req.hull.config = req.hull.notification.configuration;
      // FIXME: we need to do that mapping since the middleware is expecting
      // `ship` param instead of `id`
      req.hull.config.ship = req.hull.notification.configuration.id;
      next();
    });
  };
}
