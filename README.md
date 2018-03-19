# Overview

## [Hull Client](https://github.com/hull/hull-client-node)

```javascript
const hullClient = new Hull.Client({ configuration });
```

This is an example of the bare bones API client. Please refer to [it's own Github repository](https://github.com/hull/hull-client-node) for documentation.

## [Hull Middleware](#hullmiddleware)

```javascript
app.use(Hull.Middleware({ configuration }));
```

A bridge between Hull Client and a NodeJS HTTP application (e.g. express) which initializes HullClient a context for every HTTP request. See example usage below.
A standalone usage is possible (it's a strandard ExpressJS middleware), but if there is no specific reason to do so, the recommended way of building connectors is [Hull Connector](#hullconnector).

## [Hull Connector](#hullconnector)

```javascript
const connector = new Hull.Connector({ configuration });
```

A complete toolkit which is created next to ExpressJS server instance. Includes Hull Middleware and a set of official patterns to build highly scalable and efficient Connectors.

To get started see few chapters of this README first:

1. start with [Initialization](#initialization) and [Setup Helpers](#setup-helpers)
2. then have a quick look what you hava available in [Context Object](#context-object)
3. proceed to [Incoming data flow](#incoming-data-flow) or [Outgoing data flow](#outgoing-data-flow) depending on your use case

![hull node core components](/docs/assets/hull-node-components.png)

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

This middleware standardizes the instantiation of a [Hull Client](https://github.com/hull/hull-client-node) in the context of authorized HTTP request. It also fetches the entire Connector's configuration. As a result it's responsible for creating and exposing a [Context Object](#base-context), another important part is how this middleware decide where to look for configuration settings (connector ID, SECRET and ORGANIZATION) which then are applied to HullClient, for details please refer to [configuration resolve strategy](#configuration-resolve-strategy).

For configuration options refer to [API REFERENCE](./API.md#hullmiddleware).

---

# Hull.Connector

This is the smallest possible Nodejs connector implementation:

```javascript
const app = express();
app.get("/manifest.json", serveTheManifestJson);
app.listen(port);
```

As you can see connector is a simple HTTP application served from public address. It can be implemented in any way and in any technological stack as long as it implements the same API. You can find more details on connector's structure [here](https://www.hull.io/docs/apps/ships/).

## Initialization

```javascript
const Hull = require("hull");

const connector = new Hull.Connector({
  port: 1234, // port to start express app on
  hostSecret: "secret", // a secret generated random string used as a private key
});
```

This is the instance of the `Connector` module which exposes a set of utilities which can be applied to the main [express](http://expressjs.com/) app. All configuration options are listen in [API REFERENCE](./API.md#hullconnector)

The utilities and special middlewares can be taken one-by-one from the library and applied to the application manually, but to make the whole process easier, there are two helper methods that set everything up for you:

### Setup Helpers

```javascript
const express = require("express");
const Hull = require("hull");

const app = express();
const connector = new Hull.Connector({ hostSecret, port });

connector.setupApp(app); // apply connector related features to the application
app.post("/fetch-all", (req, res) => {
  // req.hull is the full Context Object!
  req.hull.client.get("/segments")
    .then((segments) => {
      res.json(segments);
    });
});
connector.startApp(app); // apply termination middlewares and internally calls `app.listen`
```

Setup Helpers are two high-level methods exposed by initialized Connector instances to apply custom middlewares to the Express application. Those middlewares enrich the request object with full [Context Object](#context-object).

To get more details on how those helpers methods work please see [API REFERENCE](./API.md#setupapp)

---

# Context Object

[Hull.Connector](#hullconnector) apply multiple middlewares to the request handler, including [Hull.Middleware](#hullmiddleware). The result is a **Context Object** that's available in all action handlers and routers as `req.hull`. It's a set of parameters and modules to work in the context of current organization and connector instance. This Context is divided into a base set by `Hull.Middleware` (if you use it standalone) and an extended set applied when using `Hull.Connector` and helpers method descibed above.

Here is the base structure of the Context Object (we also provide Flow type for this object [here](./API.md#thullreqcontext)).

```javascript
{
  // set by Hull.Middleware
  requestId: "",
  config: {},
  token: "",
  client: { // Instance of "new Hull.Client()"
    logger: {},
  },
  ship: {
    //The values for the settings defined in the Connector's settings tab
    private_settings: {},
    settings: {}
  },
  hostname: req.hostname,
  options: req.query + req.body,

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

## Base Context - set by Hull.Middleware

### **requestId**

unique identifier for a specific request. Will be used to enrich the context of all the logs emitted by the the [Hull.Client logger](https://github.com/hull/hull-client-node/#setting-a-requestid-in-the-logs-context). This value is automatically added by the `notifHandler` and `smartNotifierHandler` with the SNS `MessageId` or SmartNotifier `notification_id`.

### **config**

an object carrying `id`, `secret` and `organization`. You can setup it prior to the Hull Middleware execution (via custom middleware) to override default [configuration strategy](#configuration-resolve-strategy).

### **token**

an encrypted version of configuration. If it's already set in the request, Hull Middleware will try to decrypt it and get the configuration from it. If it's not available at the beginning and middleware resolved the configuration from other sources it will encrypt it and set `req.hull.token` value.

When the connector needs to send the information outside the Hull ecosystem it has to use the token, not to expose the raw credentials. The usual places where this happens are:

- dashboard links
- oAuth flow (callback url)
- external incoming webhooks

### **client**

[Hull API client](https://github.com/hull/hull-client-node) initialized to work with current organization and connector.

### **ship**

ship object with manifest information and `private_settings` fetched from the Hull Platform.
`ship` is the legacy name for Connectors.

### **hostname**

Hostname of the current request. Since the connector are stateless services this information allows the connector to know it's public address.

### **options**

Is the object including data from `query` and `body` of the request

## Extended Context - set by `Hull.Connector`

### **connectorConfig**

Hash with connector settings, details in Hull.Connector [constructor reference](./API.md#hullconnector).

### **segments**

```json
[
  {
    "name": "Segment name",
    "id": "123abc"
  }
]
```

An array of segments defined at the organization, it's being automatically exposed to the context object.
The segment flow type is specified [here](/API.md#thullsegment).

### **cache**

Since every connector can possibly work on high volumes of data performing and handling big number of requests. Internally the cache is picked by the `Hull Middleware` to store the `ship object` and by `segmentsMiddleware` to store `segments list`. The cache can be also used for other purposes, e.g. for minimizing the External API calls. `Caching Module` is exposing three public methods:

```javascript
ctx.cache.get("object_name");
ctx.cache.set("object_name", objectValue);
ctx.cache.wrap("object_name", (objectValue) => {
  return Promise.resolve(objectValue);
});
```

[Full API reference](./API.md#cache)

### **enqueue**

**This is generally a deprecated idea and should not be implemented in new connectors. Fluent flow control should be used instead.**

```javascript
req.hull.enqueue("jobName", { user: [] }, options = {});
```

A function added to context by `Queue Module`. It allows to perform tasks in an async manner. The queue is processed in background in a sequential way, it allows to:

- respond quickly in the express application actions (they just queue the work)
- split the workload into smaller chunks (e.g. for extract parsing)
- control the concurrency - most of the SERVICE APIs have rate limits

[Full API reference](./API.md#enqueue)

### **metric**

An object added to context by `Instrumentation Module`. It allows to send data to metrics service. It's being initiated in the right context, and expose following methods:

```javascript
req.hull.metric.value("metricName", metricValue = 1);
req.hull.metric.increment("metricName", incrementValue = 1); // increments the metric value
req.hull.metric.event("eventName", { text = "", properties = {} });
```

An object added to context by the `Instrumentation Module`. It allows to send data to the metrics service. [Full API reference](./API.md#metric)

### **helpers**

Helpers are just a set of simple functions added to the Context Object which make common operation easier to perform. They all follow [context management convention](#context-management-convention) but the functions can be also used in a standalone manner:

```javascript
const { updateSettings } = require("hull/lib/helpers");

app.post("/request", (req, res) => {
  updateSettings(req.hull, { called: true });
  // or:
  req.hull.helpers.updateSettings({ called: true });
});
```


Beside of connector setting updating, they also simplify working with [outgoing extracts](#batch-extracts).

All helpers are listed in [API REFERENCE](./API.md#helpers)

### **service**

A namespace reserved for connector developer to inject a custom modules. When the connector base code evolves, the best technique to keep it maintainable is to split it into a set of functions or classes. The `service` namespace is reserved for the purpose and should be used together with `use` method on connector instance to apply custom middleware. That should be an object with custom structure adjusted to specific connector needs and scale:

```javascript
// custom middleware creating the `service` param
connector.use((req, res, next) => {
  req.hull.service = {
    customFunction: customFunction.bind(req.hull),
    customModule: new CustomClass(req.hull)
  };
  next();
});

connector.setupApp(app);

app.get("/action", (req, res) => {
  const { service } = req.hull;
  service.customFunction(req.query.user_id);
  // or
  service.customModule.customMethod(req.query.user_id);
});
```

We strongly advice to follow our [context management convention](#context-management-convention) which make it easy to keep functions and classes signatures clean and standard.

### **message**

Optional - set if there is a sns message incoming.

It contains the raw, message object - should not be used directly by the connector, `req.hull.notification` is added for that purpose.

```javascript
Type: "Notification",
Subject: "user_report:update",
Message: "{\"user\":{}}"
```

### **notification**

Optional - if the incoming message type if `Notification`, then the messaged is parsed and set to notification.

```javascript
subject: "user_report:update",
timestamp: new Date(message.Timestamp),
paload: { user: {} }
```

### **smartNotifierResponse**

Use setFlowControl to instruct the Smart notifier how to handle backpressure.

```javascript
ctx.smartNotifierResponse.setFlowControl({
  type: 'next',
  size: 100,
  in: 5000
});
```

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
2. After the [Context Object](#context) is built - after calling `setupApp(app)` - all context object would be initiated, but `req.hull.client`, `req.hull.segments` and `req.hull.ship` will be present **only if** credentials are passed.
3. Before the closing `startApp(app)` call which internally calls `app.listen()`

## Context management convention

The [context object](#context-object) is treated by the `Hull.Connector` as a [dependency injection](https://en.wikipedia.org/wiki/Dependency_injection) container which carries on all required dependencies to be used in actions, jobs or custom methods.

This library sticks to a the following convention of managing the context object:

### Functions

All functions take context as a first argument:

```javascript
function getProperties(context, prop) {
  cons { client } = context;
  return client.get("/properties", { prop });
}
```

This allow binding such functions to the context and using bound version

```javascript
const getProp = getProperties.bind(null, context);
getProp("test") === getProperties(context, "test");
```

### Classes

In case of a class the context is the one and only argument:

```javascript
class ServiceAgent {
  constructor(context) {
    this.client = context.client;
  }
}
```

All functions and classes listed in [API reference](./API.md) and available in the [context object](#context-object) follow this convention when used from contex object they will be already bound, so you don't need to provide the first argument when using them.

---

# Incoming data flow

To get data into platform we need to use `traits` or `track` methods from `HullClient` (see details [here](https://github.com/hull/hull-client-node/#methods-for-user-or-account-scoped-instance)). When using `Hull.Connector` we have the client initialized in the correct context so we can use it right away.

Let's write the simplest possible HTTP endpoint on the connector to fetch some users:

```javascript
const app = express();
const connector = new Hull.Connector();

connector.setupApp(app);

app.get("/fetch-all-users", (req, res) => {
  const ctx = req.hull;
  const { api_key } = ctx.ship.private_settings;

  // let's try to get some data from 3rd party API
  const customApiClient = new CustomApiClient(api_key);

  customApiClient.fetchUsers()
    .then(users => {
      return users.map((user) => {
        return ctx.client.asUser(user.ident).traits(user.attributes);
      });
    })
    .then(() => {
      res.end("ok");
    });
});

connector.startApp(app);
```

Then we can create a button on the connector dashboard to run it or call it from any other place. The only requirement is that the enpoint is called with credentials according to the [configuration resolve strategy](#configuration-resolve-strategy).

## Schedules

If you want to run specific endpoint with a selected interval you can use `schedules` param of the manifest.json:

```json
{
 "schedules": [
    {
      "url": "/fetch-users",
      "type": "cron",
      "value": "*/5 * * * *"
    }
  ]
}
```

The implementation of the `/fetch-users` is very same as above `/fetch-all-users` just apply `setupApp` and `startApp` methods and you have full context available.

---

# Outgoing data flow

To peform operations on in response to new data coming in or being updated on Hull Platform we use two means of communications - [notifications](#notifications) which are triggered on per user/event/change basis or [batch extracts](#batch-extracts) which can be sent manually from the dashboard UI or requested by the connector.

## Notifications

All events triggered on user base result in a notification hitting specified connector endpoint. Current Hull Connector version supports two generations of those notifications - legacy and new "smart-notifier". Following guide assume you are using the new generation.

To subscribe to platform notifications, define the endpoint in connector manifest.json:

```json
{
  "tags": ["smart-notifier"],
  "subscriptions": [{
    "url": "/smart-notifier"
  }]
}
```

Then in ExpressJS server definition we need to pick `smartNotifierHandler` from `utils` directory:

```javascript
const { smartNotifierHandler } = require("hull/lib/utils");

const app = express();
const connector = new Hull.Connector();

connector.setupApp(app);

app.use("/smart-notifier", smartNotifierHandler({
  handlers: {
    "user:update": (ctx, messages = []) => {
      // more about `smartNotifierResponse` below
      ctx.smartNotifierResponse.setFlowControl({
        type: "next",
        size: 100,
        in: 5000
      });
      return Promise.resolve();
    }
  }
}))

connector.startApp(app);
```

The `user:update` handler will be run with batches of notification messages coming from platform. User update message is a json object which is grouping together all events and changes which happened on the specic user since the previous notification. The structure of the single message is defined in [this Flow Type](./API.md#thulluserupdatemessage).

Inside the handler you can use any object from the [Context Object](#context-object). Remember that the handler needs to return a valid promise at the end of it's operations.

Full information on `smartNotifierHandler` is available in [API REFERENCE](./API.md#smartnotifierhandler).

### FlowControl

`Smart-notifier` generation of notifications delivery allows us to setup `flow control ` which define pace at which connector will be called with new messages:

```javascript
ctx.smartNotifierResponse.setFlowControl({
  type: "next", // `next` or `retry`, defines next flow action
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

The Defaults are the following:

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

## Batch extracts

Second way of operating on Hull user base it to process batch extracts.

In addition to event notifications Hull supports sending extracts of the User base. These extracts can be triggered via Dashboard manual user action or can be programatically requested from Connector logic (see [requestExtract helper](./connector-helpers.md#requestextract-segment--null-path-fields---)). The Connector will receive manual batches if your ship's `manifest.json` exposes a `batch` tag in `tags`:

```json
{
  "tags": ["batch"]
}
```

In both cases the batch extract is handled by the `user:update`. The extract is split into smaller chunks using the `userHandlerOptions.maxSize` option. In extract every message will contain only `account`, `user` and `segments` information.

In addition to let the `user:update` handler detect whether it is processing a batch extract or notifications there is a third argument passed to that handler - in case of notifications it is `undefined`, otherwise it includes `query` and `body` parameters from req object.

---

# Connector status

```json
{
  "schedules": [
    {
      "url": "/status",
      "type": "cron",
      "value": "*/30 * * * *"
    }
  ]
}
```

---

# Installation & Authorization

First step of connector installation is done automatically by the platform and the only needed part from connector end is manifest.json file.

However typically after the installation we want that the connector is authorized with the 3rd party API.

Hull Node comes with packaged authentication handler using Passport - the utility is called oAuthHandler and you can find documentation [here](./API.md#oauthhandler).

---

# Utilities

Beside of `Hull.Connector` class and `Context Object` all other public API elements of this library is exposed as `Utils` which are standalone functions to be picked one-by-one and used in custom connector code.

List of all utilities are available [here](./API.md#utils)

## Superagent plugins

Hull Node promotes using [SuperAgent](http://visionmedia.github.io/superagent/) as a core HTTP client. We provide two plugins to add more instrumentation over the requests.

- [superagentErrorPlugin](./API.md#superagenterrorplugin)
- [superagentInstrumentationPlugin](./API.md#superagentinstrumentationplugin)
- [superagentUrlTemplatePlugin](./API.md#superagenturltemplateplugin)

---

# Infrastructure

The connector internally uses infrastructure modules to support its operation on application process level and provide some of the [Context Object](#context-object) elements like `cache`, `metric` and `enqueue`. See following API REFERENCE docs to see what is the default behavior and how to change it:

- [Instrumentation](./API.md#instrumentationagent) (for gathering metrics)
- [Cache](./API.md#cacheagent) (for caching ship object, segment lists and custom elements)
- [Queue](./API.md#queueagent) (for internal queueing purposes)
- Batcher (for internal incoming traffing grouping)

---

# Worker

More complex connectors usually need a background worker to split its operation into smaller tasks to spread the workload.

**This is generally a deprecated idea and should not be implemented in new connectors. Fluent flow control should be used instead.**

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
app.post("/fetch-all", (req, res) => {
  req.hull.enqueue('customJob', { users: [] });
});
connector.startApp(app, port);
connector.startWorker((queueName = 'queueApp'));
```

---

# Flow annotations

When using a [flow](https://flow.org) enabled project, we recommend using flow types provided by hull-node. You can import them in your source files directly from `hull` module and use `import type` flow structure:

```javascript
/* @flow */
import type { THullObject } from "hull";

parseHullObject(user: THullObject) {
  // ...
}
```

See [API REFERENCE](./API.md#types) or `src/lib/types` directory for a full list of available types.
