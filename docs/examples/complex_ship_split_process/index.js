import Hull from "hull";

import { Instrumentation, Cache, Queue } from "hull/lib/infra";
import HullApp from "hull/lib/app";

import * as serviceFunctions from "./lib";
import server from "./server";
import worker from "./worker";

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


// this file can be run in following configurations:
// COMBINED=true node index.js # will start server and worker in one process
// SERVER=true node index.js # will start only server
// WORKER=true node index.js # will start only worker
const start = {
  server: process.env.COMBINED || process.env.WORKER || false,
  worker: process.env.COMBINED || process.env.SERVER || false
};

if (start.server) {
  server(app);
}

if (start.worker) {
  worker(app);
}

app.start(start);
