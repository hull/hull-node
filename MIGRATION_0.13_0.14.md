# 0.13 -> 0.14 migration guide

1. change the way handlers are required:
    ```js
    // before
    const { oAuthHandler } = require("hull/lib/utils");
    // after
    const { oAuthHandler } = require("hull").handlers;
    ```
2. rename `smartNotifierHandler` with `notificationHandler`
    ```js
    // before
    const { smartNotifierHandler } = require("hull/lib/utils");
    // after
    const { notificationHandler } = require("hull").handlers;
    ```
3. use `batchHandler` instead of `smartNotifierHandler` and `notifHandler`
4. pass `NotificationConfiguration` object directly to `notificationHandler` and `batchHandler`:
    ```js
    // before
    app.use("/notification", smartNotificationHandler({
      handlers: {
        "user:update": () => {}
      }
    }));
    // after
    app.use("/notification", notificationHandler({
      "user:update": () => {}
    }));
    ```
5. since the middleware stack changes you can use `defaultMiddlewareSet` utility to get previous behavior. Otherwise switch to correct `handler`:

  ```js
  const { defaultMiddlewareSet } = require("hull").utils;
  app.post(
    "/custom-endpoint",
    ...defaultMiddlewareSet(),
    (req, res) => {
      req.hull
    }
  );
  ```
6. `T` prefix was removed from types
7. `req.hull.ship` was renamed to `req.hull.connector`
8. `req.hull.segments` were renamed to `req.hull.usersSegments`
