## Process level modules - infrastrcture

To run properly the applications needs some infrascture modules which needs to be initiated at the process level and then passed to the applications as dependencies. This is an optional step and it's needed in case of more detailed control of the configuration.

### Queue
It adds `req.hull.queue` function which takes name of the job, the payload as arguments. By default it's initiated inside `Hull.App` as a very simplistic in-memory queue, but in case of production grade needs, it comes with a [Kue](https://github.com/Automattic/kue) adapter which can be created like that.
When you pass your custom `queue` instance, the `Hull.App` will use it instead of the default one.

```js
import { Queue } from "hull/lib/ship/infra";

const queue = new Queue("kue", { options });

const app = new Hull.App({ queue });
```

### Cache
It adds `req.hull.cache` to store the ship and segments information in the cache not to
fetch it for every request. The `req.hull.cache` is automatically picked and used by the `Hull.Middleware`
and `segmentsMiddleware`. The default comes with the basic in-memory store, but in case of distributed connectors being run in multiple processes for reliable operation a shared cache solution should be used.
The Cache module internally uses [node-cache-manager](https://github.com/BryanDonovan/node-cache-manager), so any of it's compatibile store like `redis` or `memcache` could be used:

```js
import { Cache } from "hull/lib/ship/infra";

const cache = new Cache({ options });

const app = new Hull.App({ cache });
```

### Instrumentation
It automatically sends data to DataDog, Sentry and Newrelic if appropriate ENV VARS are set.
It also adds `req.hull.metric` agent to add custom metrics to the ship. Right now it doesn't take any custom options, but it's showed here for the sake of completeness.

```js
import { Instrumentation } from "hull/lib/ship/infra";

const instrumentation = new Instrumentation();

const app = new Hull.App({ instrumentation });
```

### Batcher


### Handling the process shutdown
Two infrastrcture services needs to be notified about the exit event:

- `Queue` - to drain and stop the current queue processing
- `Batcher` which needs to flush all pending data.


