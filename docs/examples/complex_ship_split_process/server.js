/**
 * File configuring the server application of the HullApp
 */
import { actionRouter, batchHandler, notifHandler, oAuthHandler, batcherHandler } from "hull/lib/utils";

export default function Server({ app, clientId, clientSecret }) {
  app.get("/fetch-all", actionRouter((req, { query, body }) => {

  }));

  app.use("/notify", notifHandler({
    "user:update": (ctx, message) => {
    }
    "ship:update": (ctx, messages) => {
    }
  }))

  app.use("/admin", oAuthHandler({
    clientId,
    clientSecret,
    onLogin: () => {}
  }));

  app.use("/webhook", batcherHandler((ctx, messages) => {

  }, { batchSize: 100 }))

  return app;
}
