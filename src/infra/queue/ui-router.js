const { Router } = require("express");
const basicAuth = require("basic-auth");

function auth(pass) {
  return (req, res, next) => {
    const user = basicAuth(req) || {};

    if (user.pass !== pass) {
      res.set("WWW-Authenticate", "Basic realm=Authorization Required");
      return res.sendStatus(401);
    }

    return next();
  };
}

module.exports = function queueUiRouter({ hostSecret, queueAgent, queue }) {
  const router = Router(); //eslint-disable-line new-cap

  router.use(auth(hostSecret));
  // @deprecated queueAgent
  (queueAgent || queue).adapter.setupUiRouter(router);

  return router;
};
