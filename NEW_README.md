# Hull Connector SDK

This library provides a runtime framework to build and run connectors applications.
It supports only currently active Node JS LTS version. It's line 8.x right now.

**Upgrading hull-node from 0.13?** See migration guide [here](./MIGRATION_0.13_0.14.md).

1. Get started
2. Examples
  - Processing outgoing data flow
  - Processing data replay
  - Fetching incoming data
  - Processing incoming webhooks
  - Providing settings data
  - Triggering one time jobs
3. Handlers
  - Handlers Configuration
  - notificationHandler
  - batchHandler
  - scheduleHandler
  - oauthHandler
  - actionHandler
  - requestsBufferHandler
4. Context
5. Utils
  - Hull API helpers
  - Superagent Plugins
  - Stream helpers
  - Misc utils
6. Development

## Get started

```js
const express = require("express");
const { Connector } = require("hull");
const { notificationHandler } = require("hull/lib/handlers");

const connector = new Connector({ ...options });

const app = express();

connector.setupApp(app);

// specify handlers, see details below
app.use("/notification", notificationHandler({
  "user:update": (ctx, messages) => {
    // process user update messages
  }
}));

connector.startApp(app);
```

## Examples

### Processing outgoing data flow

To process outgoing data flow which occurs whenever there is any change on the Hull User or Hull Account we need to register an endpoint which will be notified on each change:

**manifest.json**
```json
{
  subscriptions: [
    { url: "/notification" }
  ]
}
```

Then in our connector code we need to implement `notificationHandler` and pass there a map of processing callback which will do the actual work

```js
const express = require("express");
const { Connector } = require("hull");
const { notificationHandler } = require("hull").handlers;

const connector = new Connector({ ...options });
// const { notificationHandler } = connector.handlers;
const app = express();

connector.setupApp(app);

// specify handlers, see details below
app.use("/notification", notificationHandler({
  "user:update": (ctx, messages) => {
    // process user update messages
  }
}));

connector.startApp(app);
```

### Processing data replay
batchHandler

### Fetching incoming data

**manifest.json**
```json
{
  schedules: [
    { url: "/fetch-users" }
  ]
}
```

Then in our connector code we need to implement `notificationHandler` and pass there a map of processing callback which will do the actual work

```js
const express = require("express");
const { Connector } = require("hull");
const { scheduleHandler } = require("hull").handlers;

const connector = new Connector({ ...options });
const app = express();

connector.setupApp(app);

// specify handlers, see details below
app.use("/fetch-users", scheduleHandler("schedule:fetch-users", {
  "schedule:fetch-users": (ctx) => {
    // perform api calls to fetch the data
  }
}));

connec;
```

### Processing incoming webhooks

If external service connector integrates with provides sending it's updates as webhook requests we provide a way to handle then

```js
const express = require("express");
const { Connector } = require("hull");
const { requestsBufferHandler } = require("hull").handlers;

const connector = new Connector({ ...options });
// const { notificationHandler } = connector.handlers;
const app = express();

connector.setupApp(app);

// specify handlers, see details below
app.use("/incoming-webhook", requestsBufferHandler("incoming:webhook", {
  "incoming:webhook": (ctx, simplifiedRequests = []) => {
    // process user update messages
  }
}));

connector.startApp(app);
```
### Handling oAuth authorization flow
oauthHandler

### Triggering one time jobs

### Providing data for settings


## Handlers

### Handler Configuration

```js
// @flow
import type { HullHandlersConfiguration } from "hull";

const handlersConfiguration: HullHandlersConfiguration = {
  "user:update": () => {},
  "account:update": {
    callback: () => {},
    options: {},
  }
  "scheduler:fetch": () => {},
  "incoming:webook": {
    callback: () => {},
    options: {}
  }
};
```

### Notification Handler

https://www.hull.io/docs/reference/connectors/#subscriptions

```js
const { notificationHandler } = require("hull").handlers;

app.use("/notification", notificationHandler({
  "user:update": () => {

  }
}));
```

### Schedule Handler

https://www.hull.io/docs/reference/connectors/#schedules

```js
const { scheduleHandler } = require("hull").handlers;

app.use("/fetch-users", scheduleHandler((ctx) => {

}));
```

### Batch Handler

https://www.hull.io/docs/reference/connectors/#batches

```js
const { batchHandler } = require("hull").handlers;

app.use("/batch", batchHandler({
  "user:update": () => {

  }
}));
```

### Requests Buffer Handler

```js
const { requestsBufferHandler } = require("hull").handlers;

app.use("/webhook", requestsBufferHandler((ctx) => {

}));
```

## Context

The context object carries all helpers and modules scoped to given connector instance.

It is being build by middleware stack in 4 steps:


1. **Base context** initiates cache, metrics and queue helpers, injects basic information from original request. This is a synchronuous step.
    - the base context is built by [contextBaseMiddleware](src/middlewares/context-base.js)
    - the `HullContextBase` flow type is defined [here](src/types.js#L41)
2. **Credentials resolution**. This steps tries to resolve connector credentials from query params or notification body. In the latter variant this is an asynchronuous operation.
    - credentials from notification body are resolved by [credentialsFromNotification](src/middlewares/credentials-from-notification.js)
    - credentials from query params are resolved by [credentialsFromQuery](src/middlewares/credentials-from-query.js)
    - the `HullContextWithCredentials` flow type is defined [here](src/types.js#L57)
3. Given credentials we **initiate Hull Client** which allow us to perform operations against Hull Platform
    - `HullClient` is iniated by [clientMiddleware](src/middlewares/client.js)
    - the `HullContextWithClient` flow type is defined [here](src/types.js#L67)
4. In this final step we **build the rest of the context object** - connectors details object and users & accounts segments lists. If we have notification at hand we pick this information from its body, otherwise we query the API an cache the results
    - full context is derived from notification body by [bodyFullContextMiddleware](src/middlewares/full-context-body.js)
    - full context is fetched from platform by [fetchFullContextMiddleware](src/middlewares/full-context-fetch.js)
    - the `HullContextFull` flow type is defined [here](src/types.js#79)

## Utils

### Hull API helpers
### Superagent Plugins
### Stream helpers
### Misc utils

## Development

`DEBUG=hull-connector:*`
