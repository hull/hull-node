# Ship toolkit
This library includes a base toolkit to create a ship - connector to integrate Hull platform with a 3rd party API Service.

## Application

### WebApp
```js
import { WebApp } from "hull/lib/ship/app";

const app = new WebApp();
```

This is a base public facing web application which exposes a http rest api to communicate with hull platform.
The `WebApp` function returns an instance of [express](http://expressjs.com/) application with basic static router which serves [manifest.json](https://www.hull.io/docs/apps/ships/#file-structure) file and README.md.

### WorkerApp
```js
import { WorkerApp } from "hull/lib/ship/app";

// Worker needs Queue instance - details below
const worker = new WorkerApp({ queue });

worker.process({
  customJob: (req) => { process }
});
```

More complex ships needs to handle its operation using a background queue. This toolkit provides a base worker application which consume the jobs queued from both `WebApp` and `WorkerApp`.

### Integration with Hull Client
Both application support middlewares so it's easy to integrate it with the Hull Client middleware:
```js
import { Hull } from "hull";
import { WorkerApp, WebApp } from "hull/lub/ship/app";

const webApp = new WebApp();
const workerApp = new WebApp({ queue });

webApp.use(Hull.Middleware({ hostSecret }));
workerApp.use(Hull.Middleware({ hostSecret }));

// now both web actions and worker jobs can access:
// req.hull.client, req.hull.ship and req.hull.agent
```

## Process level modules - infrastrcture

To run properly the applications needs some infrascture modules which needs to be initiated at the process level and then passed to the applications as dependencies.

### Instrumentation
```js
import { Instrumentation } from "hull/lib/ship/infra";

const instrumentation = new Instrumentation();

const app = new WebApp({ instrumentation });
const worker = new WorkerApp({ instrumentation, queue });
```

### Queue
```js
import { Queue } from "hull/lib/ship/infra";

const queue = new Queue({ options });

const app = new WebApp({ queue });

const worker = new WorkerApp({ queue });
```

### Cache
```js
import { Cache } from "hull/lib/ship/infra";

const cache = new Cache({ options });

const app = new WebApp({ cache });

const worker = new WorkerApp({ cache, queue });
```
