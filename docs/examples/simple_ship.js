import Hull from "hull";

// pick what we need from the hull-node
import { WebApp } from "hull/ship/app";
import { batchHandler, oAuthHandler } from "hull/ship/util";

// pick the methods
import { fetchAll, sendUsers } from "./lib";

const port = process.env.PORT;
const hostSecret = process.env.SECRET;
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;

/**
 * Express application with static routing view engine,
 * can be changed into a decorator/command pattern:
 * patchedExpressApp = WebApp(expressApp);
 * @type {WebApp}
 */
const app = new WebApp({ Hull });

app.use(Hull.Middleware({ hostSecret }));


app.use("/fetch-all", (req, res) => {
  return fetchAll(req.hull)
    .then(() => res.end("ok"), () => res.end("err"));
}));

app.use("/batch", batchHandler(users => {
  return sendUsers(req.hull, users);
}));

app.use("/admin", oAuthHandler({
  clientId,
  clientSecret,
  onLogin: () => {}
}));

app.listen(port);
