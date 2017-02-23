import Hull from "hull";

// pick what we need from the hull-node
import { batchHandler, oAuthHandler, actionRouter } from "hull/lib/utils";


const port = process.env.PORT;
const hostSecret = process.env.SECRET;

const app = new Hull.App({ port, hostSecret });

/**
 * instance of express app coming with additional set of middlewares
 */
const server = app.server();

server.use("/fetch-all", actionRouter((ctx, { query, body }) => {
  ctx.hull.logger.info("fetch-all", { query, body });
}));

server.use("/batch", batchHandler((ctx, users) => {
  ctx.hull.logger.info("batch", { users });
}, { batchSize: 200 }));

app.start();
