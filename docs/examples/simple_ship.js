import Hull from "hull";

// pick what we need from the hull-node
import { batchHandler, oAuthHandler, actionRouter } from "hull/lib/utils";

// pick the methods
import { fetchAll, sendUsers } from "./lib";

const port = process.env.PORT;
const hostSecret = process.env.SECRET;

/**
 * Express application with static routing view engine,
 * can be changed into a decorator/command pattern:
 * patchedExpressApp = WebApp(expressApp);
 * @type {HullApp}
 */
const app = new Hull.App({ port, hostSecret });

const server = app.server();

server.use("/fetch-all", actionRouter((ctx, { query, body }) => {
  ctx.hull.logger.info("fetch-all", { query, body });
}));

server.use("/batch", batchHandler((ctx, users) => {
  ctx.hull.logger.info("batch", { users });
}, { batchSize: 200 }));

app.start();
