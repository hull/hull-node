import Hull from "hull";

// pick what we need from the hull-node
import HullApp from "hull/lib/app";
import { batchHandler, oAuthHandler } from "hull/lib/utils";

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
 * @type {HullApp}
 */
const app = new HullApp({ Hull });

const server = app.server();

server.use("/fetch-all", (req, res) => {
  return fetchAll(req.hull)
    .then(() => res.end("ok"), () => res.end("err"));
}));

server.use("/batch", batchHandler((users) => {
  return sendUsers(req.hull, users);
}, { batchSize: 200 }));

server.use("/admin", oAuthHandler({
  clientId,
  clientSecret,
  onLogin: () => {}
}));


app.start();
