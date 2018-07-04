# Hull Connector SDK

This library provides a framework to build and run connectors applications.

- Get started
- Handlers
- Context


## Get started

```js
const express = require("express");
const { Connector } = require("hull");

const connector = new Connector({

});

const app = express();

connector.setupApp(app);

// specify handlers, see below

connector.startApp(app);
```

## Handlers



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


1. Base context - initiates cache, metrics and queue helpers, injects basic information from original request. This is a synchronuous step.
  - the base context is built in [contextBaseMiddlewareFactory](./src/middlewares/context-base-middleware-factory.js)
  - the flow type for it is defined [here](./src/types.js#41)
2. Credentials resolution. This steps tries to resolve connector credentials from query params or notification body. In the latter variant this is an asynchronuous operation.
3. Given credentials we initiate Hull Client which allow us to perform operations against Hull Platform
4. In this final step we build the rest of the context object - connectors details object and users & accounts segments lists. If we have notification at hand we pick this information from its body, otherwise we query the API an cache the results

## Debug

`DEBUG=hull-connector:*`
