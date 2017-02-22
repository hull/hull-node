/**
 * File configuring the server application of the HullApp
 */
import { actionRouter, batchHandler, notifHandler, oAuthHandler, webhookHandler } from "hull/utils";

export default function Server({ app, clientId, clientSecret }) {
  /**
   * Express application with static router and view
   * @type {WebApp}
   */
  const express = app.server();


  express.get("/fetch-all", actionRouter(req => {
    const { agent, service, queue } = req.hull;

    return service.agent.getLastFetchTime()
      .then(lastTime => {
        return queue("fetchAll", { lastTime });
      });
  }));

  express.use("/notify", notifHandler({
    "user:update": [
      (ctx, messages) => {

      },
      { batchSize: 100 }
    ],
    "ship:update": [
      (ctx, messages) => {

      }
    ]
  }))

  server.use("/admin", oAuthHandler({
    clientId,
    clientSecret,
    onLogin: () => {}
  }));

  express.use("/webhook", webhookHandler((ctx, messages) => {
  }, { batchSize: 100 }))



  return express;
}
