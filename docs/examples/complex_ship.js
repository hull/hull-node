import { BatchHandler, WebApp, Instrumentation, ActionRouter, BatchRouter, NotifRouter, ServiceMiddleware } from "hull/utils";

import * as serviceFunctions from "./lib";

/**
 * Instrumenting dependency - enables `metric` object in context
 * @type {Instrumentation}
 */
const instrumentation = new Instrumentation();

/**
 * Cache - enables `cache` object in context
 * @type {Cache}
 */
const cache = new Cache();

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
 * Express application with static router and view
 * @type {WebApp}
 */
const app = new WebApp({ instrumentation, queue, cache });

/**
 * The middleware which adds additional utilities/modules
 * into `service` namespace of the context object.
 * Class would be initiated with context as a param:
 * `client: new ServiceClient(context)`
 * Functions will be bound with the context as a first param:
 * `func: func.bind(null, context)`
 */
app.use(ServiceMiddleware({
  client: ServiceClient,
  agent: serviceFunctions
}));


app.get("/fetch-all", actionRouter(req => {
  const { agent, service, queue } = req.hull;

  return service.agent.getLastFetchTime()
    .then(lastTime => {
      return queue("fetchAll", { lastTime });
    });
}));

app.listen();

/*
  Worker App
 */

const worker = new WorkerApp({ instrumentation, queue, cache });

app.use(ServiceMiddleware({
  client: ServiceClient,
  agent: serviceFunctions
}));

worker.process({
  fetchAll: req => {
    const { lastTime } = req.payload;
    const { service } = req.hull;

    return service.agent.getRecentUsers(users => {
      return service.agent.sendUsers(users);
    });
  }
});
