This module it optional to `WebApp`, but it's required to use `WorkerApp`.

You need to setup a selected adapter, then pass it to the `WorkerApp` constructor.
To enable it in `WebApp` use `QueueMiddleware` with the same instance of `QueueAdapter`.
It injects `req.hull.queue` function which allows queueing jobs.
