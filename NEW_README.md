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
This is the minimal connector implementation Hull Node SDK:

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

> **PRO TIP:** the snippet above specify handler configuration directly as handler arguments, but the good practise is to specify it separately as one centralized JS object with all channels and callbacks, and then pass the same to all handlers. All examples below use this good practise.

## Examples
Below you can see real life examples of how to implement typical use case scenarios for most of the connectors.

### Processing outgoing data flow

To process outgoing data flow which occurs whenever there is any change on the Hull User or Hull Account we need to register an endpoint which will be notified on each change:

**manifest.json**
```json
{
  "subscriptions": [
    { "url": "/notification" }
  ]
}
```

Then in our connector code we need to implement `notificationHandler` and pass there a map of processing callbacks which will do the actual work:

```js
const express = require("express");
const { Connector } = require("hull");
const { notificationHandler } = require("hull/lib/handlers");

const connector = new Connector({ ...options });
const app = express();

const handlersConfiguration = {
  "user:update": (ctx, messages) => {
    // process user update messages
  },
  "account:update": (ctx, messages) => {
    // process user update messages
  }
};

connector.setupApp(app);

app.use("/notification", notificationHandler(handlersConfiguration));

connector.startApp(app);
```

### Processing data replays (batches)

In addition to continuous outgoing traffic Hull provides a way to manually push selected users or accounts to the connector forcing syncing them or resyncing them.

To add support of data replay you need to add the `batch` or `batch-accounts` tag to manifest.json, depending if you want to support users, accounts or both.

**manifest.json**
```json
{
  "tags": [
    "batch",
    "batch-accounts"
  ]
}
```

Then you need to handle new endpoints on the connector: `POST /batch` and `POST /batch-accounts`. To do so add `batchHandler` on those routes:

```js
const express = require("express");
const { Connector } = require("hull");
const { batchHandler } = require("hull/lib/handlers");

const connector = new Connector({ ...options });
const app = express();

const handlersConfiguration = {
  "user:update": (ctx, messages) => {
    // process user update messages
  },
  "account:update": (ctx, messages) => {
    // process user update messages
  }
};

connector.setupApp(app);

app.use("/batch", batchHandler(handlersConfiguration));

app.use("/batch-accounts", batchHandler(handlersConfiguration));

connector.startApp(app);
```

### Fetching continuously incoming data

To continuously poll an external API to fetch new data into Hull you can use the `schedules` feature. To register a webhook to be called every 5 minutes put this into your manifest.json:

**manifest.json**
```json
{
  "schedules": [
    {
      "url": "/fetch-users",
      "type": "interval",
      "value": "5"
    }
  ]
}
```
[See more information about this schema here](https://www.hull.io/docs/reference/connectors/#subscriptions)

Then in our connector code we need to implement `scheduleHandler` and then pass there **one entry from handlers configuration**. This is the difference between `notificationHandler` and `scheduleHandler` - `notificationHandler` can process multiple channels while `scheduleHandler` performs only one action.

```js
const express = require("express");
const { Connector } = require("hull");
const { scheduleHandler } = require("hull").handlers;

const connector = new Connector({ ...options });
const app = express();

const handlersConfiguration = {
  // the name of the key here is up to you
  "schedule:fetch-users": (ctx) => {
    // perform api calls to fetch the data
  } 
};

connector.setupApp(app);

app.use("/fetch-users", scheduleHandler(
  handlersConfiguration["schedule:fetch-users"]
));

connector.startApp(app);
```

### Processing incoming webhooks

If external service you are integrating with, provides sending it's updates as webhook requests we provide a way to handle then more easily.
`requestsBufferHandler` provides a way to handle HTTP requests grouping them in memory allowing you to work on them in chunks.

This handler require you to provide a custom middleware the route before handler to provide `clientCredentials` to let handler know how to initiate HullClient.

```js
const express = require("express");
const { Connector } = require("hull");
const { requestsBufferHandler } = require("hull/lib/handlers");

const decodeAuthorizationHeader = require("./lib/decode-authorization-header");

const connector = new Connector({ ...options });
const app = express();

const handlersConfiguration = {
  "incoming:webhook": (ctx, simplifiedRequests = []) => {
    // process simplifiedRequests which contains:
    // { body, query }
  }
};

connector.setupApp(app);

// specify handlers, see details below
app.use(
  "/incoming-webhook",
  (req, res, next) => {
    // take HullCredentials from the correct place
    const credentials = decodeAuthorizationHeader(req.headers["auth-header"]);

    // if we have correct credentials store it as clientCredentials
    if (credentials) {
      req.hull.clientCredentials = credentials;
      return next();
    }
    // if not we respond to the external API in a correct way
    return res.status(401).end("authorization data is missing");
  },
  requestsBufferHandler(handlersConfiguration["incoming:webhook"])
);

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
  },
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

### base params
- requestId?: string, // request id
- hostname: string, // req.hostname
- options: Object, // req.query
- isBatch: boolean

### infra utils
- cache
- metric
- enqueue

### HullClient related params
clientConfig
clientCredentials: HullClientCredentials,
clientCredentialsToken: string,
client: HullClient,

### organization state
connector: HullConnector,
usersSegments: Array<HullSegment>,
accountsSegments: Array<HullSegment>,

### notification handler
- notification - 
- notificationResponse - 

### advanced params
- connectorConfig
- HullClient
- handlerName?: string

## How context is built?
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
    - the `` flow type is defined [here](src/types.js#79)

## Utils

### Hull API helpers
### Superagent Plugins
### Stream helpers
### Misc utils

## Development

`DEBUG=hull-connector:*`
