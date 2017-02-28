import Hull from "hull";
import express from "express";

// pick what we need from the hull-node
import { batchHandler, oAuthHandler, actionRouter } from "hull/lib/utils";


const port = process.env.PORT;
const hostSecret = process.env.SECRET;

const connector = new Hull.Connector({ port, hostSecret });
const app = express();
connector.setupApp(app);

app.use("/fetch-all", actionRouter((ctx, { query, body }) => {
  ctx.hull.logger.info("fetch-all", { query, body });
}));

app.use("/batch", batchHandler((ctx, users) => {
  ctx.hull.logger.info("batch", { users });
}, { batchSize: 200 }));

connector.startApp(app);
