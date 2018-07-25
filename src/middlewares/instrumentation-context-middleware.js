function instrumentationContextMiddlewareFactory() {
  return function instrumentationContextMiddleware(req, res, next) {
    const { metric } = req.hull;
    metric.mergeContext(req);
    next();
  };
}
module.exports = instrumentationContextMiddlewareFactory;
