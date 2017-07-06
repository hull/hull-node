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
      next();
    }

    bodyParser.json({ limit: "10mb" })(req, res, () => {
      req.hull.notification = req.body;
      next();
    });
  };
}
