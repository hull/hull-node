/**
 * This is main file which loads all dependencies
 * and decide how to load server and/or worker applications.
 * It could be run in following configurations:
 *
 * `$ COMBINED=true node index.js # will start server and worker in one process`
 * `$ SERVER=true node index.js # will start only server`
 * `$ WORKER=true node index.js # will start only worker`
 */

import Hull from "hull";
import express from "app";

import { Instrumentation, Cache, Queue } from "hull/lib/infra";

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

/**
 * Custom logic injected into request context object
 * @type {Object}
 */
const service = {
  client: ServiceClient,
  ...serviceFunctions
};

const connector = new Hull.Connector({ hostSecret, port, instrumentation, cache, queue, service });
const app = express();
connector.setupApp(app);

const startConfig = {
  server: process.env.COMBINED || process.env.SERVER || false,
  worker: process.env.COMBINED || process.env.WORKER || false
};

if (startConfig.server) {
  server({ app, clientId, clientSecret });
  connector.startApp(app);
}

if (startConfig.worker) {
  worker({ app });
  connector.startWorker();
}


