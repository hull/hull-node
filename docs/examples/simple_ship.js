import Hull from "hull";

// pick what we need from the hull-node
import { WebApp, Instrumentation } from "hull/ship";
import { ActionRouter, BatchRouter, OAuthRouter } from "hull/ship/router";

// pick the methods
import { fetchAll, sendUsers } from "./lib";

const port = process.env.PORT;
const hostSecret = process.env.SECRET;
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;

/**
 * Instrumentation agent - enables `metric` object in req.hull context object
 * @type {Instrumentation}
 */
const instrumentation = new Instrumentation();

/**
 * Express application with static routing view engine,
 * can be changed into a decorator/command pattern:
 * patchedExpressApp = WebApp(expressApp);
 * @type {WebApp}
 */
const app = new WebApp({ instrumentation });

app.use("/fetch-all", ActionRouter(req => {
  return fetchAll(req.hull);
}));

app.use("/batch", BatchRouter(users => {
  return sendUsers(req.hull, users);
}));

app.use("/admin", OAuthRouter({
  instrumentation,
  hostSecret,
  clientId,
  clientSecret,
  onLogin: () => {}
}));

app.listen(port, () => {
  Hull.logger.info("server.listen", port);
});
