import Hull from "hull";

import { Instrumentation, Cache, Queue } from "hull/infra";
import HullApp from "hull/app";
import { serviceMiddleware, actionRouter, batchHandler, notifHandler } from "hull/util";

import * as serviceFunctions from "./lib";

/**
 * Instrumenting dependency - enables `metric` object in context
 * @type {Instrumentation}
 */
const instrumentation = new Instrumentation({ options });

/**
 * Cache - enables `cache` object in context
 * @type {Cache}
 */
const cache = new Cache({ options - REDIS/MEMORY });

/**
 * Queue - enables `queue` function in context
 * @type {Queue}
 */
const queue = new Queue();

const port = process.env.PORT;
const hostSecret = process.env.SECRET;
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;

const service = {
  client: ServiceClient,
  ...serviceFunctions
};

const app = new HullApp({ Hull, instrumentation, cache, queue, service });

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

/*
  Worker App
 */
const worker = app.worker();



worker.attach({
  fetchAll: req => {
    const { lastTime } = req.payload;
    const { service } = req.hull;

    return service.getRecentUsers(users => {
      return service.sendUsers(users);
    });
  }
});



app.start({ worker: true, server: true }); // calls server.listen();



