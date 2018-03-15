# Overview

## [Hull Client](https://github.com/hull/hull-client-node)

```javascript
const hullClient = new Hull.Client({ configuration });
```

Most low level Hull Platform API client. Please refer to [separate Github repository](https://github.com/hull/hull-client-node) for documentation.

## [Hull Middleware](#hullmiddleware)

```javascript
app.use(Hull.Middleware({ configuration }));
```

A bridge between Hull Client and a NodeJS HTTP application (e.g. express) which initializes context for every HTTP request.

## [Hull Connector](#hullconnector)

```javascript
const connector = new Hull.Connector({ configuration });
```

A complete toolkit to operate with Hull Client in request handlers. Includes Hull Middleware and a set of official patterns to build highly scalable and efficient Connectors

![hull node core components](/assets/docs/hull-node-components.png)

---

# Hull.Middleware

> Example usage

```javascript
const Hull = require("hull");
const express = require("express");

const app = express();
app.use(Hull.Middleware({ hostSecret: "secret" }));
app.post("/show-segments", (req, res) => {
  req.hull.client.get("/segments").then(segments => {
    res.json(segments);
  });
});
```

This middleware standardizes the instantiation of a [Hull Client](https://github.com/hull/hull-client-node) in the context of authorized HTTP request. It also fetches the entire ship's configuration. As a result it's responsible for creating Base part of [Context Object](#basecontext).

For configuration details refer to [API REFERENCE](./API.md#hullmiddleware)

---

# Hull.Connector

This is the smallest possible Nodejs connector implementation:

```javascript
const app = express();
app.get("/manifest.json", serveTheManifestJson);
app.listen(port);
```

The connector is a simple HTTP application served from public address. It could be implemented in any way and in any technological stack unless it implements the same API.

Yet to ease the connector development and to extract common code base the `hull-node` library comes with the **Hull.Connector** toolkit which simplify the process of building new connector by a set of helpers and utilities which follows the same convention.

## Initialization

```javascript
const Hull = require("hull");

const connector = new Hull.Connector({
  port: 1234, // port to start express app on
  hostSecret: "secret", // a secret generated random string used as a private key
});
```

This is the instance of the `Connector` module which exposes a set of utilities which can be applied to the main [express](http://expressjs.com/) app. All configuration options are listen in [API REFERENCE](./API.md#hullconnector)

The utilities can be taken one-by-one and applied the the application manually, but to make the whole process easier there are two helper method exposed which applies everything be default:

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

To get more details on how they work please refere [API REFERENCE](./API.md#setupApp)

---

# Context Object

[Hull.Connector](#hullconnector) and [Hull.Middleware](#hullmiddleware) applies multiple middlewares to the request handler. The result is `req.hull` object which is the **Context Object** - a set of parameters and modules to work in the context of current organization and connector instance. This Context is divided into base set by Hull.Middleware (if you use it standalone) and extended applied when using `Hull.Connector`

```javascript
{
  // set by Hull.Middleware
  requestId: "",
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

## Base Context

### **requestId**

unique identifier for a specific request. Will be used to enrich the context of all the logs emitted by the the Hull.Client logger. This value is automatically added by the `notifHandler` and `smartNotifierHandler` with the SNS `MessageId` or SmartNotifier `notification_id`.

### **config**

an object carrying `id`, `secret` and `organization`. You can setup it prior to the Hull Middleware execution (via custom middleware) to ovewrite default configuration strategy

### **token**

an encrypted version of configuration. If it's already set in the request, Hull Middleware will try to decrypt it and get configuration from it. If it's not available at the beginning and middleware resolved the configuration from other sources it will encrypt it and set `req.hull.token` value.

When the connector needs to send the information outside the Hull ecosystem it must use the token, not to expose the raw credentials. The usual places where it happens are:

- dashboard pane links
- oAuth flow (callback url)
- external webhooks

### **client**

[Hull API client](https://github.com/hull/hull-client-node) initialized to work with current organization and connector.

### **ship**

ship object with manifest information and `private_settings` fetched from Hull Platform.

### **hostname**

Hostname of the current request. Since the connector are stateless services this information allows the connector to know it's public address.

### **params**

`Params` is the object including data from `query` and `body` of the request

## Extended Context

### **connectorConfig**

Hash with connector settings, details [here](#hullconnector)

### **segments**

```json
[
  {
    name: "Segment name",
    id: "123abc"
  }
]
```

An array of segments defined at the organization, it's being automatically exposed to the context object

### **cache**

```javascript
ctx.cache.get('object_name');
ctx.cache.set('object_name', object_value);
ctx.cache.wrap('object_name', () => {
  return Promise.resolve(object_value);
});
```

Since every connector can possibly work on high volumes of data performing and handling big number of requests. Internally the cache is picked by the `Hull Middleware` to store the `ship object` and by `segmentsMiddleware` to store `segments list`. The cache can be also used for other purposes, e.g. for minimizing the External API calls. `Caching Module` is exposing three public methods:

### **enqueue**

```javascript
req.hull.enqueue('jobName', { user: [] }, (options = {}));
```

A function added to context by `Queue Module`. It allows to perform tasks in an async manner. The queue is processed in background in a sequential way, it allows to:

- respond quickly in the express application actions (they just queue the work)
- split the workload into smaller chunks (e.g. for extract parsing)
- control the concurrency - most of the SERVICE APIs have rate limits

- **options.queueName** - when you start worker with a different queue name, you can explicitly set it here to queue specific jobs to that queue

### **metric**

```javascript
req.hull.metric.value("metricName", metricValue = 1);
req.hull.metric.increment("metricName", incrementValue = 1); // increments the metric value
req.hull.metric.event("eventName", { text = "", properties = {} });
```

An object added to context by `Instrumentation Module`. It allows to send data to metrics service. It's being initiated in the right context, and expose following methods:

### **helpers**

```javascript
req.hull.helpers.filterUserSegments();
req.hull.helpers.requestExtract();
req.hull.helpers.setUserSegments();
```

A set of functions from `connector/helpers` bound to current Context Object. More details [here](#helpers).

### **service**

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

### **message**

```javascript
Type: "Notification",
Subject: "user_report:update",
Message: "{\"user\":{}}"
```

> Optional - set if there is a sns message incoming.

It contains the raw, message object - should not be used directly by the connector, `req.hull.notification` is added for that purpose.

### **notification**

```javascript
subject: "user_report:update",
timestamp: new Date(message.Timestamp),
paload: { user: {} }
```

> Optional - if the incoming message type if `Notification`, then the messaged is parsed and set to notification.

### **smartNotifierResponse**

```javascript
ctx.smartNotifierResponse.setFlowControl({
  type: 'next',
  size: 100,
  in: 5000
});
```

> use setFlowControl to instruct the Smart notifier how to handle backpressure.


## Configuration resolve strategy

During `Context Object` building important step is how Hull Client configuration is read. The whole strategy is descibed below step-by-step.

Here is what happens when your Express app receives a query:

1. If a config object is found in `req.hull.config` steps **2** and **3** are skipped.
2. If a token is present in `req.hull.token`, the middleware will try to use the `hostSecret` to decrypt it and set `req.hull.config`.
3. If the query string (`req.query`) contains `id`, `secret`, `organization`, they will be stored in `req.hull.config`.
4. After this, if a valid configuration is available in `req.hull.config`, a Hull Client instance will be created and stored in `req.hull.client`.
5. When this is done, then the Ship will be fetched and stored in `req.hull.ship`

  If there is a `req.hull.cache` registered in the Request Context Object, it will be used to cache the ship object. For more details see [Context Object Documentation](#context)

6. If the configuration or the secret is invalid, an error will be thrown that you can catch using express error handlers.

## Custom middleware

The `Hull.Connector` architecture gives a developer 3 places to inject custom middleware:

1. At the very beginning of the middleware stack - just after `const app = express();` - this is a good place to initialy modify the incoming request, e.g. set the `req.hull.token` from custom property
2. After the [Context Object](#context) is built - after calling `setupApp(app)` - all context object would be initiated, but `req.hull.client`, `req.hull.segments` and `req.hull.ship` will be present **only if** credentials are passed. To ensure the presence of these properties [requireHullMiddleware](#requirehullmiddleware) can be used.
3. Before the closing `startApp(app)` call which internally calls `app.listen()`

**NOTE:** every `Handler` provided by this library internally uses [requireHullMiddleware](#requirehullmiddleware) and [responseMiddleware](#responsemiddleware) to wrap the provided callback function. Have it in mind while adding custom middlewares at the app and router level.

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

> In case of a class the context is the one and only argument:

```javascript
class ServiceAgent {
  constructor(context) {
    this.client = context.client;
  }
}
```

---

## Helpers

```javascript
import { updateSettings } from 'hull/lib/helpers';

app.post('/request', (req, res) => {
  updateSettings(req.hull, { called: true });
  // or:
  req.hull.helpers.updateSettings({ called: true });
});
```

Helpers are just a set of simple functions which take [Context Object](context.md) as a first argument. When being initialized by `Hull.Middleware` their are all bound to the proper object, but the functions can be also used in a standalone manner:

---

## Infrastructure

The connector internally uses infrastructure modules to support its operation:

- Instrumentation (for metrics)
- Queue (for internal queueing purposes)
- Cache (for caching ship object and segment lists)
- Batcher (for internal incoming traffing grouping)

[Read more](#infrastructure) how configure them.

**Handling the process shutdown**

Two infrastrcture services needs to be notified about the exit event:

- `Queue` - to drain and stop the current queue processing
- `Batcher` - to flush all pending data.

---

## Worker

More complex connector usually need a background worker to split its operation into smaller tasks to spread the workload:

```javascript
const express = require("express");
const Hull = require("hull");

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

---

## Utilities

In addition to the [Connector toolkit](connector.md) the library provides a variety of the utilities to perform most common actions of the ship. Following list of handlers and middleware helps in performing most common connector operations.

## Superagent plugins

Hull Node promotes using [SuperAgent](http://visionmedia.github.io/superagent/) as a core HTTP client. We provide two plugins to add more instrumentation over the requests.

---

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

## Batch Jobs (Extracts)

```json
{
  "tags": ["batch"]
}
```

> To mark a connector as supporting Batch processing, the `batch` tag should be present in `manifest.json` file.

In addition to event notifications Hull supports sending extracts of the User base. These extracts can be triggered via Dashboard manual user action or can be programatically requested from Connector logic (see [requestExtract helper](./connector-helpers.md#requestextract-segment--null-path-fields---)). The Connector will receive manual batches if your ship's `manifest.json` exposes a `batch` tag in `tags`:

In both cases the batch extract is handled by the `user:update`. The extract is split into smaller chunks using the `userHandlerOptions.maxSize` option. In extract every message will contain only `account`, `user` and `segments` information.

In addition to let the `user:update` handler detect whether it is processing a batch extract or notifications there is a third argument passed to that handler - in case of notifications it is `undefined`, otherwise it includes `query` and `body` parameters from req object.

---

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
