/**
 * File configuring the server application of the HullApp
 */
import { actionRouter, batchHandler, notifHandler, oAuthHandler, batcherHandler } from "hull/utils";

export default function Server({ app, clientId, clientSecret }) {
  /**
   * Express application with static router and view
   * @type {WebApp}
   */
  const express = app.server();


  express.get("/fetch-all", actionRouter((req, { query, body }) => {

  }));

  express.use("/notify", notifHandler({
    "user:update": (ctx, messages) => {
    }
    "ship:update": (ctx, messages) => {
    }
  }))

  server.use("/admin", oAuthHandler({
    clientId,
    clientSecret,
    onLogin: () => {}
  }));

  express.use("/webhook", batcherHandler((ctx, messages) => {

  }, { batchSize: 100 }))

  return express;
}
