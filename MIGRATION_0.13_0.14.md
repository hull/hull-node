# 0.13 -> 0.14 migration guide

1. rename `smartNotifierHandler` to `notificationHandler`

```js
// before
const { smartNotifierHandler } = require("hull/lib/utils");
// after
const { notificationHandler } = require("hull/lib/utils");
```

2. use `batchHandler` instead of `smartNotifierHandler` or `notifHandler` to handle `/batch` endpoints. At some point we integrated batch feature support within those two handlers, but since batch is a very different behavior from technical perspective we decided to bring back a separate handler. The problem which we wanted to solve by hiding batch feature within other handlers was not to repeat outgoing traffic logic, but now we found a better way to do so, to centrialize handlers configuration object:

```js
// before
// TODO: NEEDS EXAMPLE
// after
// TODO: NEEDS EXAMPLE
```


3. use [`HullHandlersConfiguration`](src/types.js#L167) flow type object when setting up `notificationHandler` and `batchHandler`. The main difference is that we do not wrap everything in `handlers` param and we can optionally pass `callback` and `options` params instead of function.
When using `scheduleHandler` or `actionHandler` you need to pass a valid  `HullHandlersConfigurationEntry`.

```js
// before
app.use("/notification", smartNotificationHandler({
  handlers: {
    "user:update": () => {}
  }
}));
// after, new format:
app.use("/notification", notificationHandler({
  "user:update": () => {},
  "account:update": {
    callback: () => {},
    options: {}
  }
}));
```


4. `req.hull.ship` was renamed to `req.hull.connector`

5. `req.hull.segments` and `req.hull.users_segments` were renamed to `req.hull.usersSegments` and `req.hull.accounts_segments` was renamed to `req.hull.accountsSegments`

6. added ability to insert a middleware before the Hull stack so that you get a change to prepare the environment to build a Hull context:

```js
const app = expresss();
app.use((req, res, next) => {
  req.hull = req.hull || {};
  // Your custom logic to place the token in the right place
  req.hull.clientCredentialsToken = req.query.token
  // Hull middleware will run after that to build the full context;
  next();
})
//start the connector: the previous middleware will run first.
const connector = new Hull.Connector(options);
connector.setupApp(app);
```

7. `T` prefix was removed from flow types

8. HullClient dependency was upgraded to version 2.0.0, see changes here: https://github.com/hull/hull-client-node/blob/master/CHANGELOG.md#200-beta1

9. `const Hull = require("hull");` is not a `HullClient` class anymore.
10. As a result, the way the Logger can be configured has changed:

```js
// before
Hull.logger.transports.console.level = "debug";
// after
Hull.Client.logger.transports.console.level = "debug";
```

10. `Hull.Middleware` or `Hull.middleware` is not available anymore, it is inserted automatically when calling `new Hull.Connector(); connector.setupApp(app)`

```js
const { hullContextMiddleware } = require("hull");
app.use(hullContextMiddleware());
```

11. The `req.hull.helpers` object was removed. Some of the helpers were moved to `utils`. `filterNotifications` helper is not available anymore, implement custom `filterUtil` instead.

```js
// before
app.post("/", (req, res) => {
  req.hull.helpers.updateSettings({ newSettings });
});

// after
const { settingsUpdate } = require("hull/lib/utils");
app.post( "/", (req, res) => settingsUpdate(req.hull, { newSettings }));
```

12. You can now use flow generics to create your own connector Flow type, containing the `settings` and `private_settings` that you've defined in the manifest. You can then wrap this in custom `HullContext` and `HullRequest` types

```js
// in your types.js:
import type {
  HullConnector as Connector,
  HullRequest as Request,
  HullContext as Context,
} from 'hull';
export type HullConnector = {
  // IMPORTANT: FOR SPREAD SYNTAX:
  // https://github.com/facebook/flow/issues/3534#issuecomment-287580240
  ...$Exact<Connector>,
  settings: { /* your own settings */ },
  private_settings: { /* your own private settings */ }
};
export type HullContext = Context<HullConnector>;
export type HullRequest = Request<HullContext>;
```

13. Reply to Hull with a flow-typed envelope using the `HullNotificationResponse` type

```js
import { notificationDefaultFlowControl } from "hull/lib/utils";

const handler = function(
  ctx: HullContext,
  messages: Array<HullUserUpdateMessage>
): Promise<HullNotificationResponse> {
  return Promise.all(
    _.compact(messages.map(message => foo(ctx, message)))
  ).then(response => ({
    flow_control: {
      type: "next",
      size: 100,
      in: 1,
      in_time: 0
    }
  }));
};
```


14. the `ship` parameter in querystring is deprecated, please use `id` instead

15. use `debug` like so: `DEBUG=hull-* yarn dev` in your projects to see debugging info 

16. included `express.json` (https://expressjs.com/en/api.html#express.json), Configure using `new Hull.connnector({ json: JSON_OPTIONS })`, where JSON_OPTIONS are the ones from `express.json`. We use the following defaults: ` { limit: "10mb" }`

```js
  new Hull.Connector({
    //rest of config,
    json: {
      limit: "10mb"
    }
  })
```

15. allow env variables to directly se the default cache params:
//cache-agent.js
_.defaults(options, {
  ttl: process.env.CONNECTOR_CACHE_TTL || 60 /* seconds */,
  max: process.env.CONNECTOR_CACHE_MAX || 100 /* items */,
  store: "memory",
});

16. Deprecated (hull.asUser(string) && hull.asAccount(string)) syntax. use hull.asUser({id: string}) instead

17.. removed connector code to handle log_level, just set the LOG_LEVEL env. variable
18. pass connectorConfig.logLevel optionally to set Logging Level

18. Added new method of booting a connector, 100% packaged with no need for express anymore, Declarative routes.

```js
const connectorConfig: HullConnectorConfing = {
  logLevel: LOG_LEVEL,
  hostSecret: SECRET,
  port: PORT,
  clientConfig: {
    firehoseUrl: OVERRIDE_FIREHOSE_URL
  },
  cache:
    REDIS_URL &&
    new Cache({
      store: redisStore,
      url: REDIS_URL,
      ttl: SHIP_CACHE_TTL || 60
    })
}

const manifest = require("./manifest.json");

Hull.start({
  devMode: NODE_ENV === "development",
  manifest,
  connectorConfig,
  middlewares: [batMiddleware, barMiddleware], //Will run before Hull Middlewares
  handlers: { //named hash of objects
    foo,
    status,
    userUpdate,
    accountUpdate,
    userBatch,
    accountBatch
  }
});
```

### Manifest.json contains:
```js
{
  //...
  "actions": [],
  "tabs": [
    {
      "url": "admin.html",
      "handler": "admin", //this is the name of the handler that will be used.
      "options": {
        "title": "Credentials",
        "size": "small",
        "editable": false
      }
    }
  ],
  "status": [
    {
       "url": "/status",
       "handler": "status", //this is the name of the handler that will be used.
       "options": {       
         "interval": "5",
       } // handler options
    }
  ]
  "schedules": [
    {
       "url": "/status",
       "handler": "status", //this is the name of the handler that will be used.
       "options": {       
         "interval": "5",
       } // handler options
    }
  ],
  "subscriptions" : [
    {
      "url" : "/notifier",
      "channels": {
        "user:update": {
          "handler": "userUpdate", //this is the name of the handler that will be used.
          "options": {} // handler options
        },
        "account:update": {
          "handler": "accountUpdate", //this is the name of the handler that will be used.
          "options": {} // handler options
        }
      }
    }
  ],
  "batch" : [
    {
      "url" : "/batch",
      "channels": {
        "user:update": {
          "handler": "userUpdate", //this is the name of the handler that will be used.
          "options": {} // handler options
        }
      }
    },
    {
      "url" : "/batch-accounts",
      "channels": {
        "account:update": {
          "handler": "accountUpdate", //this is the name of the handler that will be used.
          "options": {} // handler options
        }
      }
    }
  ],
  "endpoints": [
    {
      "url": "/segment",
      "method": "POST",
      "handler": "segment", //this is the name of the handler that will be used.
      "options": {} // handler options
    }
  ]
}
```

Expects connectors to expose handlers with the following Signature:

```js
//from types.js
export type HullExternalResponse = Promise<any>;
export type HullNotificationResponse = Promise<{
  flow_control: HullNotificationFlowControl,
  responses: Array<?HullMessageResponse>
}>;

function(ctx: HullContext, messages: Array<
  HullConnectorUpdateMessage
  |HullUserUpdateMessage
  |HullUserDeleteMessage
  |HullAccountUpdateMessage
  |HullAccountDeleteMessage
  |HullSegmentUpdateMessage
  |HullSegmentDeleteMessage
  |HullExternalHandlerMessage>): HullNotificationResponse | HullExternalResponse {
}
```
