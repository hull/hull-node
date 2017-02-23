# Connector toolkit
This library includes a base toolkit to create a ship - connector to integrate Hull platform with a selected 3rd party API Service.

## HullApp
```js
import Hull from "hull";

const app = new Hull.App({ port, hostSecret, service });

// ... application configuration

app.start();

```

### server()
```js
const app = new Hull.App({ port, hostSecret, service });

const server = app.server();

server.use("/customRoute", customRouter);
```

This is a base public facing web application which exposes a http rest api to communicate with hull platform.
The `app.server()` method returns an instance of [express](http://expressjs.com/) application with basic static router which serves [manifest.json](https://www.hull.io/docs/apps/ships/#file-structure) file and README.md.

### worker()
```js
const app = new Hull.App({ port, hostSecret, service });

// Worker needs Queue instance - details below
const worker = app.worker();

worker.attach({
  customJob: (req) => { process }
});
```

More complex ships needs to handle its operation using a background queue. This toolkit provides a base worker application which consume the jobs queued from both `server` and `worker`.

## Context Object
In all `server` actions and `worker` job there is a context object available as a first argument of the callbacks.
Here are the details about its structure: [Context](./CONTEXT.md)

## More Information

- [Handlers to build your connector](./HANDLERS.md)
- [Example connectors](./examples)
- [Infrastructure modules](./INFRA.md)
- [Internal Middleware](./MIDDLEWARES.md)

