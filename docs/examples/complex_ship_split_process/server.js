import { actionRouter, batchHandler, notifHandler, webhookHandler } from "hull/utils";

export default function Server(app) {
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
      (messages) => {

      },
      { batchSize: 100 }
    ],
    "ship:update": [
      (messages) => {

      }
    ]
  }))
  express.use("/webhook", webhookHandler((messages) => {

  }, { batchSize: 100 }))

  return express;
}
