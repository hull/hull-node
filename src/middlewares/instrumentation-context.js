function instrumentationContextMiddlewareFactory({ handlerName } = {}) {
  return function instrumentationContextMiddleware(req, res, next) {
    const { metric } = req.hull;
    if (metric) {
      metric.mergeContext(req);
      if (handlerName) {
        req.hull.handlerName = handlerName;
      }
      req.hull.metric.increment("connector.request", 1);
    }
    next();
  };
}
module.exports = instrumentationContextMiddlewareFactory;
