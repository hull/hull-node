# 0.13 -> 0.14 migration guide

1. change the way handlers are required:
    ```js
    const { oAuthHandler } = require("hull/lib/utils");
    // replace with:
    const { oAuthHandler } = require("hull").handlers;
    ```
2. rename `smartNotifierHandler` with `notificationHandler`
    ```js
    const { smartNotifierHandler } = require("hull/lib/utils");
    // replace with:
    const { notificationHandler } = require("hull").handlers;
    ```
3. use `batchHandler` instead of `smartNotifierHandler` and `notifHandler`

4. since the middleware stack changes you can use `defaultMiddlewareSet` utility to get previous behavior. Otherwise switch to correct `handler`:

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
