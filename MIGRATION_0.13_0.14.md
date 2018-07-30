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
    
    // after
    ```
3. use [`HullHandlersConfiguration`](src/types.js#L167) flow type object when setting up `notificationHandler` and `batchHandler`. The main difference is that we do not wrap everything in `handlers` param and we can optionally pass `callback` and `options` params instead of function.
When using `scheduleHandler` or `actionHandler` you need to pass `HullHandlersConfigurationEntry`.
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
4. `req.hull.ship` was renamed to `req.hull.connector`
5. `req.hull.segments` and `req.hull.users_segments` were renamed to `req.hull.usersSegments` and `req.hull.accounts_segments` was renamed to `req.hull.accountsSegments`
6. although all routes of the connector application communicating with the platform should be using appropriate handler, if you need to use plain expressjs routes you can use `credsFromQueryMiddlewares` utility to get full `req.hull` context. This is a breaking change, version 0.13 was preparing `req.hull` object on `connector.setupApp` level not on the handler level.
    ```js
    const { credsFromQueryMiddlewares } = require("hull/lib/utils");
    app.post(
      "/custom-endpoint",
      ...credsFromQueryMiddlewares(),
      (req, res) => {
        req.hull
      }
    );
    ```
7. `T` prefix was removed from flow types
8. HullClient dependency was upgraded to version 2.0.0, see changes here: https://github.com/hull/hull-client-node/blob/master/CHANGELOG.md#200-beta1
9. `const Hull = require("hull");` is not a `HullClient` class anymore, so you need to change:
    ```js
    // before
    Hull.logger.transports.console.level = "debug";
    // after
    Hull.Client.logger.transports.console.level = "debug";
    ```
10. `Hull.Middleware` or `Hull.middleware` is not available anymore, you need to use `const { clientMiddleware } = require("hull/lib/middlewares");`
11. `req.hull.helpers` object was removed. Some of the helpers were moved to `utils`. `filterNotifications` helper is not available anymore, implement custom `filterUtil`.
    ```js
    // before
    app.post("/", (req, res) => {
      req.hull.helpers.updateSettings({ newSettings });
    });

    // after
    const { settingsUpdate } = require("hull/lib/utils");
    const { credsFromQueryMiddlewares } = require("hull/lib/utils");
    app.post(
      "/",
      ...credsFromQueryMiddlewares(),
      (req, res) => {
        settingsUpdate(req.hull, { newSettings });
      }
    );
    ```
