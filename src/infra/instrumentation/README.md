Instrumentation agent which is required by `WebApp` and `WorkerApp`,
it injects `MetricAgent` object into `req.hull.metric` param.

It uses following environmental variables:
`NEW_RELIC_LICENSE_KEY`, `DATADOG_API_KEY`, `SENTRY_URL`
All are optional.
