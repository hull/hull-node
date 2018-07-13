# 0.13 -> 0.14 migration guide

1. change the way handlers are required:
    ```js
    // before
    const { oAuthHandler } = require("hull/lib/utils");
    const { devMode } = require("hull/lib/utils");
    // after
    const { oAuthHandler } = require("hull").handlers;
    const { devMode } = require("hull/lib/utils");
    ```
    All handlers were moved to `Hull.handlers` rest of the utils are available as before
2. rename `smartNotifierHandler` with `notificationHandler`
    ```js
    // before
    const { smartNotifierHandler } = require("hull/lib/utils");
    // after
    const { notificationHandler } = require("hull").handlers;
    ```
3. use `batchHandler` instead of `smartNotifierHandler` and `notifHandler`
4. use [`HullNotificationHandlerConfiguration`](src/types.js#L154) flow type object when setting up `notificationHandler` and `batchHandler`. The main difference is that we do not wrap everything in `handlers` param and we can optionally pass `callback` and `options` params instead of function
    ```js
    // before
    app.use("/notification", smartNotificationHandler({
      handlers: {
        "user:update": () => {}
      }
    }));
    // after
    app.use("/notification", notificationHandler({
      "user:update": () => {},
      "account:update": {
        callback: () => {},
        options: {}
      }
    }));
    ```
5. although all routes of the connector communicating with the platform should be usiing appropriate handler, if you need to use plain expressjs routes you can use `credsFromQueryMiddlewares` utility to get full `req.hull` context:
    ```js
    const { credsFromQueryMiddlewares } = require("hull").utils;
    app.post(
      "/custom-endpoint",
      ...credsFromQueryMiddlewares(),
      (req, res) => {
        req.hull
      }
    );
    ```
6. `T` prefix was removed from flow types
7. `req.hull.ship` was renamed to `req.hull.connector`
8. `req.hull.segments` and `req.hull.users_segments` were renamed to `req.hull.usersSegments` and `req.hull.accounts_segments` was renamed to `req.hull.accountsSegments`
10. `const Hull = require("hull");` is not a `HullClient` class anymore, so you need to change:
    ```js
    // before
    Hull.logger.transports.console.level;
    // after
    Hull.Client.logger.transports.console.level = "debug";
    ```
11. filter-notifications helper is not available anymore, implement custom filterUtil
