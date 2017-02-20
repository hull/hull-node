# Ideas for next Ships gen

We have a set of utilities/modules working on two levels of the application:

### Process scope
Being initiated at the process level:
  - infrastructure dependencies: Instrumentation, Cache, Queue
  - application logic: WebApp, WorkerApp
  - application utilities: BatchRouter, OAuthRouter, NotifRouter, ServiceMiddleware

### Request scope
Being initiated at the request level - Hull Client, Service Agent, Service Client, Metric
All takes context as a dependency injection container.


## Context management

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

In case of class the context is the one and only argument:

```javascript

class ServiceAgent {
  constructor(context) {
    this.client = context.client;
  }
}
```

## Problems and changes

1. How to inject custom context elements to utilities like BatchRouter, NotifRouter (which have a internal stack of middleware)?

We have two level of middleware:
  - app level - global middleware applied to every request
  - router level - middleware applied to `BatchRouter`, `NotifRouter`

`cache`, `metrics`, `queue` can be safely added at the global level - don't depend on other modules at the initialization step, they resolve the dependency at the call step (`req.hull.metric.value()` - picks data from `req.hull.client.configuration()` when called)

**But** when we want to initialize whole class the context would be resolved at the initialization step.
In such case we need to make sure that middleware which initiate custom module is called ***after***
the hull client middleware which is bad because we would need to do something like this:

```javascript
const app = WebApp({ instrumentation, cache, queue });

// instead of doing this in every action:
app.post("/batch", (req, res) => {
  const customAgent = new ServiceAgent(req.hull)
});

// that's not perfect - we are chaning standard express fluent chainable pattern (`.use().use()`)
// into rigid positional arguments pattern `function(A, B, C, D)`
app.use("/batch", batchRouter(serviceMiddleware, req => {
  
}));
```

One idea to fix the problem is to avoid creating classes which forces the constructor dependency resolution:

```javascript
class {
  constructor(context) {
    this.client = context.client;
    this.ship = context.ship;
    // etc
  }

  getData() {
    return this.client.get("/data")
  }
}
```

Into objects of context bound functions:

```javascript
getData function(context) {
  const { client } = context;
  return client.get("/data");
}

// we can safely bind context to the method at any middleware level
getData.bind(this, context);
```

but it could be very tricky to handle situations where some dependency is missing.

2. We dont need `cacheShip`, `fetchShip` options in hull client middleware since we need the `ship` always,
and we try to cache it when the cache object is supplied to the app.

3. Do we need `hull.userToken()`, `hull.currentUserId()` and `hull.currentUserMiddleware()` in case of the ship only use case?

