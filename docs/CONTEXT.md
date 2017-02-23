# Context object
`HullApp` applies multiple middleware to the request handler.
The result is `req.hull` object which is the Context Object - a set of modules to work in the context of current organization and connector instance.

```javascript
{
  client: {
    logger: {},
  },
  ship: {},
  segments: [],
  hostname: req.hostname,
  cache: {},
  enqueue: () => {},
  metric: {},
  service: {},
  message: {},
  notification: {}
}
```

#### client
[Hull API client](../README.md) initialized to work with current organization

#### ship
Ship object with manifest information and `private_settings`

#### segments
An array of segments information

#### hostname
Hostname of the current request.

#### cache
[Caching object](../src/infra/cache/ship-cache.js)

#### enqueue
A [function](../src/infra/queue/enqueue.js) to perform tasks in async manner.

#### metric
An [object](../src/infra/instrumentation/metric-agent.js) to send data to metrics service.

#### service
A namespace reserved for connector developer to inject a custom logic, which needs to work in the context.
It is applied to the context object by [this middleware](../src/utils/service-middleware.js), it takes a plain javascript object with the definition of API, that is a list of functions and classes.
What it injects into the context object is a mapped javscript object with the same keys, bound functions and objects of initiated classes. The binding and initialization does the following:

- function is bind with the context object as a first argument - `fn.bind(null, ctx)`
- class is initiated with the context object as a first and only argument to the constructor - `new class(ctx)`

#### message
optional - set if there is a sns message incoming


#### notification
What is the relation to the `req.hull.message`?

## Context management convention
The context object is treated by the `Hull.App` as a [dependency injection](https://en.wikipedia.org/wiki/Dependency_injection) container which carries on all required dependencies to be used in actions, jobs or custom methods.

This library sticks to a the following convention of managing the context object:

### Functions
Every "pure" function which needs context to operate takes it as a first argument:

```javascript
function getProperties(context, prop) {
  cons { client } = context;
  return client.get("/properties", { prop });
}
```

This allow binding functions to the context and using bound version:

```javascript
const getProp = getProperties.bind(null, context);

getProp("test") === getProperties(context, "test")
```

### Classes
In case of class the context is the one and only argument:

```javascript

class ServiceAgent {
  constructor(context) {
    this.client = context.client;
  }
}
```

