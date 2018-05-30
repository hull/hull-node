function haltOnTimedoutMiddlewareFactory() {
  return function haltOnTimedoutMiddleware(req, res, next) {
    if (!req.timedout) {
      next();
    }
  };
}

module.exports = haltOnTimedoutMiddlewareFactory;
