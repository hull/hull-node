# Context object
`HullApp` applies multiple middleware to the request handler.
The result is `req.hull` object which is the Context Object - a toolkit to work in the context of current organization and connector instance.

```javascript
{
  client: {
    logger: {},
  },
  ship: {},
  hostname: req.hostname,
  cache: {},
  enqueue: () => {},
  metric: {},
  service: {}
}
```

### client
Hull API client initialized to work with current organization

### ship
Ship object with manifest information and `private_settings`

### hostname
Hostname of the current request.

### cache
[Caching object](src/infra/cache/ship-cache.js)

### enqueue
A [function](src/infra/queue/enqueue.js) to perform tasks in async manner.

### metric
An [object](src/infra/instrumentation/metric-agent.js) to send data to metrics service.

### service
A namespace reserved for connector developer to inject a custom logic, which needs to work in the context.
It is applied to the context object by [this middleware](src/utils/service-middleware.js), it takes a plain javascript object with the definition of API, that is a list of functions and classes.
What it injects into the context object is a mapped javscript object with the same keys, bound functions and objects of initiated classes. The binding and initialization does the following:

- function is bind with the context object as a first argument - `fn.bind(null, ctx)`
- class is initiated with the context object as a first and only argument to the constructor - `new class(ctx)`

