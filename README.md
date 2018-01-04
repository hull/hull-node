# Overview

## [Hull Client](https://github.com/hull/hull-client-node)

```javascript
const hull = new Hull({ configuration });
```

Most low level Hull Platform API client

## [Hull Middleware](#hullmiddleware)

```javascript
app.use(Hull.Middleware({ configuration }));
```

A bridge between Hull Client and a NodeJS HTTP application (e.g. express) which initializes context for every HTTP request

## [Hull Connector](#hullconnector)

```javascript
const connector = new Hull.Connector({ configuration });
```

A complete toolkit to operate with Hull Client in request handlers. Includes Hull Middleware and a set of official patterns to build highly scalable and efficient Connectors

![hull node core components](/assets/docs/hull-node-components.png)

--------------------------------------------------------------------------------

# Hull.Middleware

> Example usage

```javascript
import Hull from 'hull';
import express from 'express';

const app = express();
app.use(Hull.Middleware({ hostSecret: 'secret' }));
app.post('/show-segments', (req, res) => {
  req.hull.client.get('/segments').then(segments => {
    res.json(segments);
  });
});
```

This middleware standardizes the instantiation of a [Hull Client](https://github.com/hull/hull-client-node) in the context of authorized HTTP request. It also fetches the entire ship's configuration.

## Options

### **hostSecret**

The ship hosted secret - consider this as a private key which is used to encrypt and decrypt `req.hull.token`. The token is useful for exposing it outside the Connector <-> Hull Platform communication. For example the OAuth flow or webhooks. Thanks to the encryption no 3rd party will get access to Hull Platform credentials.

### **clientConfig**

Additional config which will be passed to the new instance of Hull Client

## Basic Context Object

The Hull Middleware operates on `req.hull` object. It uses it to setup the Hull Client and decide which configuration to pick - this are the core parameters the Middleware touches:

### **req.hull.requestId**

unique identifier for a specific request. Will be used to enrich the context of all the logs emitted by the the Hull.Client logger. This value is automatically added by the `notifHandler` and `smartNotifierHandler` with the SNS `MessageId` or SmartNotifier `notification_id`.

### **req.hull.config**

an object carrying `id`, `secret` and `organization`. You can setup it prior to the Hull Middleware execution (via custom middleware) to ovewrite default configuration strategy

### **req.hull.token**

an encrypted version of configuration. If it's already set in the request, Hull Middleware will try to decrypt it and get configuration from it. If it's not available at the beginning and middleware resolved the configuration from other sources it will encrypt it and set `req.hull.token` value.

When the connector needs to send the information outside the Hull ecosystem it must use the token, not to expose the raw credentials. The usual places where it happens are:

- dashboard pane links
- oAuth flow (callback url)
- external webhooks

### **req.hull.client**

[Hull API client](https://github.com/hull/hull-client-node) initialized to work with current organization.

### **req.hull.ship**

ship object with manifest information and `private_settings` fetched from Hull Platform.

### **req.hull.hostname**

Hostname of the current request. Since the connector are stateless services this information allows the connector to know it's public address.

## Operations - configuration resolve strategy

Here is what happens when your Express app receives a query.

1. If a config object is found in `req.hull.config` steps **2** and **3** are skipped.
2. If a token is present in `req.hull.token`, the middleware will try to use the `hostSecret` to decrypt it and set `req.hull.config`.
3. If the query string (`req.query`) contains `id`, `secret`, `organization`, they will be stored in `req.hull.config`.
4. After this, if a valid configuration is available in `req.hull.config`, a Hull Client instance will be created and stored in `req.hull.client`.
5. When this is done, then the Ship will be fetched and stored in `req.hull.ship`

  If there is a `req.hull.cache` registered in the Request Context Object, it will be used to cache the ship object. For more details see [Context Object Documentation](#context)

6. If the configuration or the secret is invalid, an error will be thrown that you can catch using express error handlers.

--------------------------------------------------------------------------------

# Hull.Connector

```javascript
const app = express();
app.get('/manifest.json', serveTheManifestJson);
app.listen(port);
```

The connector is a simple HTTP application served from public address. It could be implemented in any way and in any technological stack unless it implements the same API:

Yet to ease the connector development and to extract common code base the `hull-node` library comes with the **Hull.Connector** toolkit which simplify the process of building new connector by a set of helpers and utilities which follows the same convention.

## Initialization

```javascript
import Hull from 'hull';

const connector = new Hull.Connector({
  port: 1234, // port to start express app on
  hostSecret: 'secret', // a secret generated random string used as a private key
  segmentFilterSetting: 'synchronized_segments' // name of the connector private setting which has information about filtered segments
});
```

This is the instance of the `Connector` module which exposes a set of utilities which can be applied to the main [express](http://expressjs.com/) app. The utilities can be taken one-by-one and applied the the application manually or there are two helper method exposed which applies everything be default:

## Setup Helpers

```javascript
import express from 'express';
import Hull from 'hull';

const app = express();
const connector = new Hull.Connector({ hostSecret });

connector.setupApp(app); // apply connector related features to the application
app.post('/fetch-all', (req, res) => {
  res.end('ok');
});
connector.startApp(app, port); // internally calls app.listen
```

Setup Helpers are two high-level methods exposed by initialized Connector instance to apply custom middlewares to the Express application. Those middlewares enrich the application with connector features.

### setupApp(express app)

This method applies all features of `Hull.Connector` to the provided application:

- serving `/manifest.json`, `/readme` and `/` endpoints
- serving static assets from `/dist` and `/assets` directiories
- rendering `/views/*.html` files with `ejs` renderer
- timeouting all requests after 25 seconds
- adding Newrelic and Sentry instrumentation
- initiating the wole [Context Object](#context)
- handling the `hullToken` parameter in a default way

### startApp(express app)

This is a supplement method which calls `app.listen` internally and also terminates instrumentation of the application calls.

## Bare express application

```javascript
import { renderFile } from 'ejs';
import timeout from 'connect-timeout';
import { staticRouter } from 'hull/lib/utils';

app.engine('html', renderFile); // render engine
app.set('views', `${process.cwd()}/views`);
app.set('view engine', 'ejs');

app.use(timeout('25s')); // make sure that we will close the connection before heroku does
app.use(connector.instrumentation.startMiddleware()); // starts express app instrumentation
app.use(connector.instrumentation.contextMiddleware()); // adds `req.hull.metric`
app.use(connector.queue.contextMiddleware()); // adds `req.hull.enqueue`
app.use(connector.cache.contextMiddleware()); // adds `req.hull.cache`
app.use((req, res, next) => {
  // must set `req.hull.token` from request
  req.hull.token = req.query.hullToken;
});
app.use(connector.notifMiddleware()); // parses the incoming sns message, so the clientMiddleware knows if to bust the cache
app.use(connector.clientMiddleware()); // sets `req.hull.client` and `req.hull.ship`
app.use('/', staticRouter());

// add your routes here:
app.post('/fetch-all', (req, res) => {
  res.end('ok');
});

app.use(connector.instrumentation.stopMiddleware()); // stops instrumentation
// start the application
app.listen(port, () => {});
```

If you prefer working with the express app directly and have full control over how modules from `Hull.Connector` alter the behaviour of the application, you can pick them directly. Calling the `setupApp` and `startApp` is effectively equal to the following setup:

## Utilities

Here's some the detailed description of the utilities.

### notifMiddleware()

Runs `bodyParser.json()` and if the incoming requests is a Hull notification it verifies the incoming data and set `req.hull.message` with the raw information and `req.hull.notification` with parsed data.

### clientMiddleware()

This is a wrapper over `Hull.Middleware` whith `hostSecret` and other configuration options bound. The middleware initializes the Hull API client: `req.hull.client = new Hull({});` using credentials from (in order) `req.hull.config`, `req.hull.token` `req.hull.query`.

### instrumentation.contextMiddleware()

Adds `req.hull.metric`.

For details see [Context Object](#context) documentation.

### queue.contextMiddleware()

Adds `req.hull.enqueue`.

For details see [Context Object](#context) documentation.

### cache.contextMiddleware()

Adds `req.hull.cache`.

For details see [Context Object](#context) documentation.

### instrumentation.startMiddleware()

Instrument the requests in case of exceptions. More details about instrumentation [here](#infrastructure).

### instrumentation.stopMiddleware()

Instrument the requests in case of exceptions. More details about instrumentation [here](#infrastructure).

## Worker

```javascript
import express from 'express';
import Hull from 'hull';

const app = express();

const connector = new Hull.Connector({ hostSecret });
// apply connector related features to the application
connector.setupApp(app);

connector.worker({
  customJob: (ctx, payload) => {
    // process payload.users
  }
});
app.post('/fetch-all', (req, res) => {
  req.hull.enqueue('customJob', { users: [] });
});
connector.startApp(app, port);
connector.startWorker((queueName = 'queueApp'));
```

More complex connector usually need a background worker to split its operation into smaller tasks to spread the workload:

## Infrastructure

The connector internally uses infrastructure modules to support its operation:

- Instrumentation (for metrics)
- Queue (for internal queueing purposes)
- Cache (for caching ship object and segment lists)
- Batcher (for internal incoming traffing grouping)

[Read more](#infrastructure) how configure them.

## Utilities

Above documentation shows the basic how to setup and run the `Hull.Connector` and the express application. To implement the custom connector logic, this library comes with a set of utilities to perform most common operations.

[Here is the full list >>](#utils)

## Custom middleware

The `Hull.Connector` architecture gives a developer 3 places to inject custom middleware:

1. At the very beginning of the middleware stack - just after `const app = express();` - this is a good place to initialy modify the incoming request, e.g. set the `req.hull.token` from custom property
2. After the [Context Object](#context) is built - after calling `setupApp(app)` - all context object would be initiated, but `req.hull.client`, `req.hull.segments` and `req.hull.ship` will be present **only if** credentials are passed. To ensure the presence of these properties [requireHullMiddleware](#requirehullmiddleware) can be used.
3. Before the closing `startApp(app)` call which internally calls `app.listen()`

**NOTE:** every `Handler` provided by this library internally uses [requireHullMiddleware](#requirehullmiddleware) and [responseMiddleware](#responsemiddleware) to wrap the provided callback function. Have it in mind while adding custom middlewares at the app and router level.

--------------------------------------------------------------------------------

# Context object

[Hull.Connector](#hullconnector) and [Hull.Middleware](#hullmiddleware) applies multiple middlewares to the request handler. The result is `req.hull` object which is the **Context Object** - a set of modules to work in the context of current organization and connector instance.

```javascript
{
  // set by Hull.Middleware
  config: {},
  token: "",
  client: {
    logger: {},
  },
  ship: {},
  hostname: req.hostname,
  params: req.query + req.body,

  // set by Hull.Connector
  connectorConfig: {},
  segments: [],
  cache: {},
  enqueue: () => {},
  metric: {},
  helpers: {},
  service: {},
  message: {},
  notification: {}
  smartNotifierResponse: {}
}
```

> The core part of the **Context Object** is described in [Hull Middleware documentation](#hullmiddleware).

## **connectorConfig**

Hash with connector settings, details [here](#hullconnector)

## **segments**

```json
[
  {
    name: "Segment name",
    id: "123abc"
  }
]
```

An array of segments defined at the organization, it's being automatically exposed to the context object

## **cache**

```javascript
ctx.cache.get('object_name');
ctx.cache.set('object_name', object_value);
ctx.cache.wrap('object_name', () => {
  return Promise.resolve(object_value);
});
```

Since every connector can possibly work on high volumes of data performing and handling big number of requests. Internally the cache is picked by the `Hull Middleware` to store the `ship object` and by `segmentsMiddleware` to store `segments list`. The cache can be also used for other purposes, e.g. for minimizing the External API calls. `Caching Module` is exposing three public methods:

## **enqueue**

```javascript
req.hull.enqueue('jobName', { user: [] }, (options = {}));
```

A function added to context by `Queue Module`. It allows to perform tasks in an async manner. The queue is processed in background in a sequential way, it allows to:

- respond quickly in the express application actions (they just queue the work)
- split the workload into smaller chunks (e.g. for extract parsing)
- control the concurrency - most of the SERVICE APIs have rate limits

- **options.queueName** - when you start worker with a different queue name, you can explicitly set it here to queue specific jobs to that queue

## **metric**

```javascript
req.hull.metric.value("metricName", metricValue = 1);
req.hull.metric.increment("metricName", incrementValue = 1); // increments the metric value
req.hull.metric.event("eventName", { text = "", properties = {} });
```

An object added to context by `Instrumentation Module`. It allows to send data to metrics service. It's being initiated in the right context, and expose following methods:

## **helpers**

```javascript
req.hull.helpers.filterUserSegments();
req.hull.helpers.requestExtract();
req.hull.helpers.setUserSegments();
```

A set of functions from `connector/helpers` bound to current Context Object. More details [here](#helpers).

## **service**

```javascript
connector.use((req, res, next) => {
  req.hull.service = {
    customFunction: customFunction.bind(req.hull),
    customModule: new CustomClass(req.hull)
  };
  next();
});

connector.setupApp(app);

app.get('/action', (req, res) => {
  const { service } = req.hull;
  service.customFunction(req.query.user_id);
  // or
  service.customModule.customMethod(req.query.user_id);
});
```

A namespace reserved for connector developer to inject a custom logic. When the connector base code evolves, the best technique to keep it maintainable is to split it into a set of functions or classes. To make it even simpler and straightforward the connector toolkit uses [one convention](#context) to pass the context into the functions and classes. The `service` namespace is reserved for the purpose and should be used together with `use` method on connector instance to apply custom middleware. That should be an object with custom structure adjusted to specific connector needs and scale:

## **message**

```javascript
Type: "Notification",
Subject: "user_report:update",
Message: "{\"user\":{}}"
```

> Optional - set if there is a sns message incoming.

It contains the raw, message object - should not be used directly by the connector, `req.hull.notification` is added for that purpose.

## **notification**

```javascript
subject: "user_report:update",
timestamp: new Date(message.Timestamp),
paload: { user: {} }
```

> Optional - if the incoming message type if `Notification`, then the messaged is parsed and set to notification.

## **smartNotifierResponse**

```javascript
ctx.smartNotifierResponse.setFlowControl({
  type: 'next',
  size: 100,
  in: 5000
});
```

> use setFlowControl to instruct the Smart notifier how to handle backpressure.

## Context management convention

The context object is treated by the `Hull.Connector` as a [dependency injection](https://en.wikipedia.org/wiki/Dependency_injection) container which carries on all required dependencies to be used in actions, jobs or custom methods.

This library sticks to a the following convention of managing the context object:

### Functions

```javascript
function getProperties(context, prop) {
  cons { client } = context;
  return client.get("/properties", { prop });
}
```

> This allow binding functions to the context and using bound version

```javascript
const getProp = getProperties.bind(null, context);
getProp('test') === getProperties(context, 'test');
```

```javascript
class ServiceAgent {
  constructor(context) {
    this.client = context.client;
  }
}
```

> In case of a class the context is the one and only argument:

Every "pure" function which needs context to operate takes it as a first argument:

--------------------------------------------------------------------------------

# Helpers

This is a set of additional helper functions being exposed at `req.hull.helpers`. They allow to perform common operation in the context of current request. They are similar o `req.hull.client.utils`, but operate at higher level, ensure good practises and should be used in the first place before falling back to raw utils.

## updateSettings()

```javascript
req.hull.helpers.updateSettings({ newSettings });
```

Allows to update selected settings of the ship `private_settings` object. This is a wrapper over `hull.utils.settings.update()` call. On top of that it makes sure that the current context ship object is updated, and the ship cache is refreshed.

## requestExtract()

```javascript
req.hull.helpers.requestExtract({ segment = null, path, fields = [], additionalQuery = {} });
```

This is a method to request an extract of user base to be sent back to the Connector to a selected `path` which should be handled by `notifHandler`.

## Context

```javascript
import { updateSettings } from 'hull/lib/helpers';

app.post('/request', (req, res) => {
  updateSettings(req.hull, { called: true });
  // or:
  req.hull.helpers.updateSettings({ called: true });
});
```

Helpers are just a set of simple functions which take [Context Object](context.md) as a first argument. When being initialized by `Hull.Middleware` their are all bound to the proper object, but the functions can be also used in a standalone manner:

--------------------------------------------------------------------------------

# Infrastructure

```javascript
const instrumentation = new Instrumentation();
const cache = new Cache();
const queue = new Queue();

const connector = new Hull.Connector({ instrumentation, cache, queue });
```

Production ready connectors need some infrastructure modules to support their operation, allow instrumentation, queueing and caching. The [Hull.Connector](#hullconnector) comes with default settings, but also allows to initiate them and set a custom configuration:

## Queue

```javascript
import { Queue } from 'hull/lib/infra';
import BullAdapter from 'hull/lib/infra/queue/adapter/bull'; // or KueAdapter

const queueAdapter = new BullAdapter(options);
const queue = new Queue(queueAdapter);

const connector = new Hull.Connector({ queue });
```

By default it's initiated inside `Hull.Connector` as a very simplistic in-memory queue, but in case of production grade needs, it comes with a [Kue](https://github.com/Automattic/kue) or [Bull](https://github.com/OptimalBits/bull) adapters which you can initiate in a following way:

`Options` from the constructor of the `BullAdapter` or `KueAdapter` are passed directly to the internal init method and can be set with following parameters:

<https://github.com/Automattic/kue#redis-connection-settings> <https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#queue>

The `queue` instance has a `contextMiddleware` method which adds `req.hull.enqueue` method to queue jobs - this is done automatically by `Hull.Connector().setupApp(app)`:

```javascript
req.hull.enqueue((jobName = ''), (jobPayload = {}), (options = {}));
```

**options:**

1. **ttl** - milliseconds

  > Job producers can set an expiry value for the time their job can live in active state, so that if workers didn't reply in timely fashion, Kue will fail it with TTL exceeded error message preventing that job from being stuck in active state and spoiling concurrency.

2. **delay** - milliseconds

  > Delayed jobs may be scheduled to be queued for an arbitrary distance in time by invoking the .delay(ms) method, passing the number of milliseconds relative to now. Alternatively, you can pass a JavaScript Date object with a specific time in the future. This automatically flags the Job as "delayed".

3. **priority** - integer / string:

  ```javascript
  {
  low: 10,
  normal: 0,
  medium: -5,
  high: -10,
  critical: -15
  }
  ```

By default the job will be retried 3 times and the payload would be removed from queue after successfull completion.

Then the handlers to work on a specific jobs is defined in following way:

```javascript
connector.worker({
  jobsName: (ctx, jobPayload) => {
    // process Payload
    // this === job (kue job object)
    // return Promise
  }
});
connector.startWorker();
```

## Cache

```javascript
import redisStore from 'cache-manager-redis';
import { Cache } from 'hull/lib/infra';

const cache = new Cache({
  store: redisStore,
  url: 'redis://:XXXX@localhost:6379/0?ttl=600'
});

const connector = new Hull.Connector({ cache });
```

> The `req.hull.cache` can be used by the connector developer for any other caching purposes:

```javascript
ctx.cache.get('object_name');
ctx.cache.set('object_name', object_value);
ctx.cache.wrap('object_name', () => {
  return Promise.resolve(object_value);
});
```

The default comes with the basic in-memory store, but in case of distributed connectors being run in multiple processes for reliable operation a shared cache solution should be used. The `Cache` module internally uses [node-cache-manager](https://github.com/BryanDonovan/node-cache-manager), so any of it's compatibile store like `redis` or `memcache` could be used:

The `cache` instance also exposes `contextMiddleware` whch adds `req.hull.cache` to store the ship and segments information in the cache to not fetch it for every request. The `req.hull.cache` is automatically picked and used by the `Hull.Middleware` and `segmentsMiddleware`.

<aside class="warning">
There are two <code>object names</code> which are reserved and cannot be used here:

- any ship id
- "segments"
</aside>

<aside class="success"><strong>IMPORTANT</strong> internal caching of <code>ctx.ship</code> object is refreshed on <code>ship:update</code> notifications, if the connector doesn't subscribe for notification at all the cache won't be refreshed automatically. In such case disable caching, set short TTL or add <a href="./connector-utils.md#notifhandler">notifHandler</a>.
</aside>

## Instrumentation

```javascript
import { Instrumentation } from 'hull/lib/infra';

const instrumentation = new Instrumentation();

const connector = new Connector.App({ instrumentation });
```

It automatically sends data to DataDog, Sentry and Newrelic if appropriate ENV VARS are set:

- NEW_RELIC_LICENSE_KEY
- DATADOG_API_KEY
- SENTRY_URL

It also exposes the `contextMiddleware` which adds `req.hull.metric` agent to add custom metrics to the ship. Right now it doesn't take any custom options, but it's showed here for the sake of completeness.

## Handling the process shutdown

Two infrastrcture services needs to be notified about the exit event:

- `Queue` - to drain and stop the current queue processing
- `Batcher` - to flush all pending data.

--------------------------------------------------------------------------------

# Connector Utilities

In addition to the [Connector toolkit](connector.md) the library provides a variety of the utilities to perform most common actions of the ship. Following list of handlers and middleware helps in performing most common connector operations.

## actionHandler()

```javascript
import { actionHandler } from 'hull/lib/utils';
const app = express();

app.use(
  '/fetch-all',
  actionHandler((ctx, { query, body }) => {
    const { client, ship } = ctx;

    const { api_token } = ship.private_settings;
    const serviceClient = new ServiceClient(api_token);
    return serviceClient.getHistoricalData().then(users => {
      users.map(u => {
        client.asUser({ email: u.email }).traits({
          new_trait: u.custom_value
        });
      });
    });
  })
);
```

This is the simplest requests handler to expose custom logic through an API POST endpoint. The possible usage is triggering a custom operation (like fetching historical data) or a webhook. Both cases handle incoming flow data into Hull platform. However in case of busy webhook it's better to use [batcherHandler](#batcherhandler) which automatically group the incoming requests into batches.

## smartNotifierHandler()

```json
{
  "tags": ["smart-notifier"],
  "subscriptions": [
    {
      "url": "/notify"
    }
  ]
}
```

> To enable the smartNotifier for a connector, the `smart-notifier` tag should be present in `manifest.json` file. Otherwise, regular, unthrottled notifications will be sent without the possibility of flow control.

`smartNotifierHandler` is a next generation `notifHandler` cooperating with our internal notification tool. It handles Backpressure, throttling and retries for you and lets you adapt to any external rate limiting pattern.

```javascript
import { smartNotifierHandler } from 'hull/lib/utils';
const app = express();

const handler = smartNotifierHandler({
  handlers: {
    'ship:update': function(ctx, messages = []) {},
    'segment:update': function(ctx, messages = []) {},
    'segment:delete': function(ctx, messages = []) {},
    'account:update': function(ctx, messages = []) {},
    'user:update': function(ctx, messages = []) {
      console.log('Event Handler here', ctx, messages);
      // ctx: Context Object
      // messages: [{
      //   user: { id: '123', ... },
      //   segments: [{}],
      //   changes: {},
      //   events: [{}, {}]
      //   matchesFilter: true | false
      // }]
      // more about `smartNotifierResponse` below
      ctx.smartNotifierResponse.setFlowControl({
        type: 'next',
        size: 100,
        in: 5000
      });
      return Promise.resolve();
    }
  },
  userHandlerOptions: {
    groupTraits: false
  }
});

connector.setupApp(app);
app.use('/notify', handler);
```

```javascript
function userUpdateHandler(ctx, messages = []) {
  ctx.smartNotifierResponse.setFlowControl({
    type: 'next',
    in: 1000
  });
  return Promise.resolve();
}
```

When performing operations on notification you can set FlowControl settings using `ctx.smartNotifierResponse` helper.

## FlowControl

```javascript
ctx.smartNotifierResponse.setFlowControl({
  type: 'next', // `next` or `retry`, defines next flow action
  size: 1000, // only for `next` - number of messages for next notification
  in: 1000, // delay for next flow step in ms
  at: 1501062782 // time to trigger next flow step
});
```

FlowControl is an element of the `SmartNotifierResponse`. When the HTTP response is built it has the following structure

```javascript
// response body:
{
  flow_control: {
    type: "next",
    in: 1000
  },
  metrics: []
}
```

> The Defaults are the following:

```javascript
// for a resolved, successful promise:
{
  type: "next",
  size: 1,
  in: 1000
}

// for a rejected, erroneous promise:
{
  type: "retry",
  in: 1000
}
```

## Extracts

```json
{
  "tags": ["batch"]
}
```

> To mark a connector as supporting Batch processing, the `batch` tag should be present in `manifest.json` file.

In addition to event notifications Hull supports sending extracts of userbase. These extracts can be triggered via Dashboard manual user action or can be programatically requested from Connector logic (see [requestExtract helper](./connector-helpers.md#requestextract-segment--null-path-fields---)). The Connector will receive manual batches if your ship's `manifest.json` exposes a `batch` tag in `tags`:

In both cases the batch extract is handled by the `user:update`. The extract is split into smaller chunks using the `userHandlerOptions.maxSize` option. In extract every message will contain only `user` and `segments` information.

```javascript
import { batcherHandler } from 'hull/lib/utils';
const app = express();

app.use(
  '/fetch-all',
  batcherHandler(
    (ctx, messages) => {
      messages.map(message => {
        console.log(message); // { query, body }
      });
    },
    {
      maxSize: 100, // maximum size of the batch
      maxTime: 1000 // time time in milliseconds to flush batch after the first item came in
    }
  )
);
```

In addition to let the `user:update` handler detect whether it is processing a batch extract or notifications there is a third argument passed to that handler - in case of notifications it is `undefined`, otherwise it includes `query` and `body` parameters from req object.

The second `incoming` handler which works in a similar way as `actionHandler` but it also groups incoming requests into batches of selected size:

## notifHandler() (Legacy)

**Note** : The Smart notifier is the newer, more powerful way to handle data flows. We recommend using it instead of the NotifHandler.

NotifHandler is a packaged solution to receive User and Segment Notifications from Hull. It's built to be used as an express route. Hull will receive notifications if your ship's `manifest.json` exposes a `subscriptions` key:

```json
{
  "subscriptions": [{ "url": "/notify" }]
}
```

Here's how to use it.

```javascript
import { notifHandler } from "hull/lib/utils";
const app = express();

const handler = NotifHandler({
  userHandlerOptions: {
    groupTraits: true, // groups traits as in below examples
    maxSize: 6,
    maxTime: 10000,
    segmentFilterSetting: "synchronized_segments"
  },
  onSubscribe() {} // called when a new subscription is installed
  handlers: {
    "ship:update": function(ctx, message) {},
    "segment:update": function(ctx, message) {},
    "segment:delete": function(ctx, message) {},
    "account:update": function(ctx, message) {},
    "user:update": function(ctx, messages = []) {
      console.log('Event Handler here', ctx, messages);
      // ctx: Context Object
      // messages: [{
      //   user: { id: '123', ... },
      //   segments: [{}],
      //   changes: {},
      //   events: [{}, {}]
      //   matchesFilter: true | false
      // }]
    }
  }
})

connector.setupApp(app);
app.use('/notify', handler);
```

For example of the notifications payload [see details](./notifications.md)

## oAuthHandler()

```javascript
import { oAuthHandler } from 'hull/lib/utils';
import { Strategy as HubspotStrategy } from 'passport-hubspot';

const app = express();

app.use(
  '/auth',
  oAuthHandler({
    name: 'Hubspot',
    tokenInUrl: true,
    Strategy: HubspotStrategy,
    options: {
      clientID: 'xxxxxxxxx',
      clientSecret: 'xxxxxxxxx', //Client Secret
      scope: ['offline', 'contacts-rw', 'events-rw'] //App Scope
    },
    isSetup(req) {
      if (!!req.query.reset) return Promise.reject();
      const { token } = req.hull.ship.private_settings || {};
      return !!token
      ? Promise.resolve({ valid: true, total: 2 })
      : Promise.reject({ valid: false, total: 0 });
    },
    onLogin: req => {
      req.authParams = { ...req.body, ...req.query };
      return req.hull.client.updateSettings({
        portalId: req.authParams.portalId
      });
    },
    onAuthorize: req => {
      const { refreshToken, accessToken } = req.account || {};
      return req.hull.client.updateSettings({
        refresh_token: refreshToken,
        token: accessToken
      });
    },
    views: {
      login: 'login.html',
      home: 'home.html',
      failure: 'failure.html',
      success: 'success.html'
    }
  })
);
```

OAuthHandler is a packaged authentication handler using [Passport](http://passportjs.org/). You give it the right parameters, it handles the entire auth scenario for you.

It exposes hooks to check if the ship is Set up correctly, inject additional parameters during login, and save the returned settings during callback.

To make it working in Hull dashboard set following line in **manifest.json** file:

```json
{
  "admin": "/auth/"
}
```

### parameters:

#### name

The name displayed to the User in the various screens.

#### tokenInUrl

Some services (like Stripe) require an exact URL match. Some others (like Hubspot) don't pass the state back on the other hand.

Setting this flag to false (default: true) removes the `token` Querystring parameter in the URL to only rely on the `state` param.

#### Strategy

A Passport Strategy.

#### options

Hash passed to Passport to configure the OAuth Strategy. (See [Passport OAuth Configuration](http://passportjs.org/docs/oauth))

#### isSetup()

A method returning a Promise, resolved if the ship is correctly setup, or rejected if it needs to display the Login screen.

Lets you define in the Ship the name of the parameters you need to check for.

You can return parameters in the Promise resolve and reject methods, that will be passed to the view. This lets you display status and show buttons and more to the customer

#### onLogin()

A method returning a Promise, resolved when ready.

Best used to process form parameters, and place them in `req.authParams` to be submitted to the Login sequence. Useful to add strategy-specific parameters, such as a portal ID for Hubspot for instance.

#### onAuthorize()

A method returning a Promise, resolved when complete. Best used to save tokens and continue the sequence once saved.

#### views

> Each view will receive the following data

```javascript
views: {
  login: "login.html",
  home: "home.html",
  failure: "failure.html",
  success: "success.html"
}
//each view will receive the following data:
{
  name: "The name passed as handler",
  urls: {
    login: '/auth/login',
    success: '/auth/success',
    failure: '/auth/failure',
    home: '/auth/home',
  },
  ship: ship //The entire Ship instance's config
}
```

Required, A hash of view files for the different screens.

## requireHullMiddleware

```javascript
import { requireHullMiddleware } from 'hull/lib/utils';
const app = express();

app.post(
  '/fetch',
  Hull.Middleware({ hostSecret }),
  requireHullMidlleware,
  (req, res) => {
    // we have a guarantee that the req.hull.client
    // is properly set.
    // In case of missing credentials the `requireHullMidlleware`
    // will respond with 403 error
  }
);
```

The middleware which ensures that the Hull Client was successfully setup by the Hull.Middleware:

## responseMiddleware

> Normally one would need to do

```javascript
const app = express();

app.post('fetch', ...middleware, (req, res) => {
  performSomeAction().then(
    () => res.end('ok'),
    err => {
      req.hull.client.logger.error('fetch.error', err.stack || err);
      res.status(500).end();
    }
  );
});
```

This middleware helps sending a HTTP response and can be easily integrated with Promise based actions:

```javascript
import { responseMiddleware } from 'hull/lib/utils';
const app = express();

app.post(
  'fetch',
  ...middleware,
  (req, res, next) => {
    performSomeAction().then(next, next);
  },
  responseMiddleware
);
```

The response middleware takes that instrastructure related code outside, so the action handler can focus on the logic only. It also makes sure that both Promise resolution are handled properly

## Flow annotations

```javascript
/* @flow */
import type { THullObject } from "hull";

parseHullObject(user: THullObject) {
  // ...
}
```

> See `src/lib/types` directory for a full list of available types.

When using a [flow](https://flow.org) enabled project, we recommend using flow types provided by hull-node. You can import them in your source files directly from `hull` module and use `import type` flow structure:

## Superagent plugins

Hull Node promotes using [SuperAgent](http://visionmedia.github.io/superagent/) as a core HTTP client. We provide two plugins to add more instrumentation over the requests.

### superagentUrlTemplatePlugin

```javascript
const superagent = require('superagent');
const { superagentUrlTemplatePlugin } = require('hull/lib/utils');

const agent = superagent.agent().use(
  urlTemplatePlugin({
    defaultVariable: 'mainVariable'
  })
);

agent
.get('https://api.url/{{defaultVariable}}/resource/{{resourceId}}')
.tmplVar({
  resourceId: 123
})
.then(res => {
  assert(res.request.url === 'https://api.url/mainVariable/resource/123');
});
```

This plugin allows to pass generic url with variables - this allows better instrumentation and logging on the same REST API endpoint when resource ids varies.

### superagentInstrumentationPlugin

```javascript
const superagent = require('superagent');
const { superagentInstrumentationPlugin } = require('hull/lib/utils');

// const ctx is a Context Object here

const agent = superagent
.agent()
.use(
  urlTemplatePlugin({
    defaultVariable: 'mainVariable'
  })
)
.use(
  superagentInstrumentationPlugin({
    logger: ctx.client.logger,
    metric: ctx.metric
  })
);

agent
.get('https://api.url/{{defaultVariable}}/resource/{{resourceId}}')
.tmplVar({
  resourceId: 123
})
.then(res => {
  assert(res.request.url === 'https://api.url/mainVariable/resource/123');
});
```

This plugin takes `client.logger` and `metric` params from the `Context Object` and logs following log line:

- `ship.service_api.request` with params:

  - `url` - the original url passed to agent (use with `superagentUrlTemplatePlugin`)
  - `responseTime` - full response time in ms
  - `method` - HTTP verb
  - `status` - response status code
  - `vars` - when using `superagentUrlTemplatePlugin` it will contain all provided variables

The plugin also issue a metric with the same name `ship.service_api.request`.

> Above code will produce following log line:

```sh
connector.service_api.call {
  responseTime: 880.502444,
  method: 'GET',
  url: 'https://api.url/{{defaultVariable}}/resource/{{resourceId}}',
  status: 200
}
```

> and following metrics:

```javascript
- `ship.service_api.call` - should be migrated to `connector.service_api.call`
- `connector.service_api.responseTime`
```
