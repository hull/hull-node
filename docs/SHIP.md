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
A instrumentation service which is an optional dependency to `WebApp` and `WorkerApp`.
It automatically sends data to DataDog, Sentry and Newrelic if appropriate ENV VARS are set.
It also adds `req.hull.metric` agent to add custom metrics to the ship.

```js
import { Instrumentation } from "hull/lib/ship/infra";

const instrumentation = new Instrumentation();

const app = new WebApp({ instrumentation });
const worker = new WorkerApp({ instrumentation, queue });
```

### Queue
This is a required dependency to the `WorkerApp` and optional to `WebApp`.
It adds `req.hull.queue` function which takes name of the job, the payload as arguments.

```js
import { Queue } from "hull/lib/ship/infra";

const queue = new Queue({ options });

const app = new WebApp({ queue });

const worker = new WorkerApp({ queue });
```

### Cache
Optional caching mechanism which adds `req.hull.cache` to store the ship information in the cache not to
fetch it for every request.
The `req.hull.cache` is automatically picked and used by the `Hull.Middleware`.

```js
import { Cache } from "hull/lib/ship/infra";

const cache = new Cache({ options });

const app = new WebApp({ cache });

const worker = new WorkerApp({ cache, queue });
```

### Batcher


## Utils
In addition to the Applications and Infrastcture the toolkit provides a variety of the utilities to perform most common actions of the ship.


### NotifHandler()

NotifHandler is a packaged solution to receive User and Segment Notifications from Hull. It's built to be used as an express route. Hull will receive notifications if your ship's `manifest.json` exposes a `subscriptions` key:

```json
{
  "subscriptions" : [ { "url" : "/notify" } ]
}
```

Here's how to use it.

```js
const app = express();
import { NotifHandler } from 'hull';

const handler = NotifHandler({
  hostSecret: hostSecret //Ship's Host secret
  onSubscribe() {} // called when a new subscription is installed
  onError() {} // called when an error is raised
  handlers: {
    groupTraits: true, //Receive a nested object or a flat object for user properties containing '/'
    'event': function() {
      console.log('Event Handler here', notif, context);
      // notif: {
      //    message: {
      //      user: { id: '123', ... },
      //      segments: [ { } ],
      //      event: []
      //    },
      //    subject: 'event',
      //    timestamp: "2016-02-03T17:01:57.393Z' }
      // },
      // context: {
      //  hull: <Instance of Hull Client>
      //  ship: <Current ship instance if available>,
      //  req: < Original request, Useful to retreive additional data>
      // }

    },
    'ship:update': function(notif, context){},
    'segment:update': function(notif, context){},
    'segment:delete': function(notif, context){},
    'user:delete': function(notif, context){},
    'user:create': function(notif, context){},
    'user:update' : function(notif, context) {
      console.log('Event Handler here', notif, context);
      // notif: {
      //    message: {
      //      user: { id: '123', ... },
      //      segments: [ { } ],
      //      changes: {},
      //      events: [ {}, {} ]
      //    },
      //    subject: 'user_report:update',
      //    timestamp: "2016-02-03T17:01:57.393Z' }
      // },
      // context: {
      //  hull: <Instance of Hull Client>
      //  ship: <Current ship instance if available>,
      //  req: < Original request, Useful to retreive additional data>
      // }
    }
  }
})

app.use(Hull.Middleware({ hostSecret }));
app.post('/notify', handler);
```

Your app can subscribe to events from Hull and receive Events via http POST.
For this we provide a helper called NotifHandler that handles all the complexity of subscribing to events and routing them to specific methods. All you need to do is declare which methods handle what Events.


#### Example of `user:update` payload

```javascript
{

  // Current user properties
  "user": {
    "id": "572f63eb8c35fc5d4300034e",
    "anonymous_ids": [ "1462723549-f16cea7e-6a7d-4ba5-b506-c16bfd43ebbe" ],
    "created_at": "2016-05-08T16:06:04Z",
    "name": "Romain Dardour",
    "first_name": "Romain",
    "last_name": "Dardour",
    "domain": "hull.io",
    "email": "romain@hull.io",
    "phone": "+33600000000",
    "picture": "https://d1ts43dypk8bqh.cloudfront.net/v1/avatars/a63f299c-4fbb-4c2e-8d7e-8b4af888f890",
    "accepts_marketing": false,

    "address_city": "Paris",
    "address_country": "France",
    "address_state": "Île-de-France",

    "last_seen_at": "2017-01-10T16:26:25Z",
    "last_known_ip": "54.227.22.135",

    // Session data
    "first_seen_at": "2016-09-28T13:19:59Z",
    "first_session_initial_referrer": "",
    "first_session_initial_url": "https://hull-2.myshopify.com/",
    "first_session_platform_id": "561fb665450f34b1cf00000f",
    "first_session_started_at": "2016-09-28T13:19:59Z",

    "latest_session_initial_referrer": "https://hull-2.myshopify.com/",
    "latest_session_initial_url": "https://hull-2.myshopify.com/account/login",
    "latest_session_platform_id": "561fb665450f34b1cf00000f",
    "latest_session_started_at": "2016-10-25T10:15:34Z",

    "signup_session_initial_referrer": "",
    "signup_session_initial_url": "https://hull-2.myshopify.com/",
    "signup_session_platform_id": "561fb665450f34b1cf00000f",
    "signup_session_started_at": "2016-09-28T13:19:59Z",


    // Custom traits
    "traits": {
      "usage_score" : 89.5
    },

    // Custom traits group `hubspot`
    "hubspot": {
      "associated_deals_count": "1",
      "became_opportunity_at": "2016-09-09T07:04:36+00:00",
      "created_at": "2016-09-09T07:01:01+00:00",
      "email": "romain@hull.io",
      "fetched_at": "2017-01-10T16:40:30Z",
      "first_deal_created_at": "2016-09-28T13:24:35+00:00",
      "first_name": "Romain",
      "job_title": "COO",
      "last_name": "Dardour",
      "lifecycle_stage": "opportunity",
      "recent_deal_amount": "",
      "updated_at": "2017-01-10T16:37:55+00:00"
    }
  },

  // List of segments the user belongs to
  "segments": [
    {
      "id": "57adda830ffa84da28000083",
      "name": "Dudes called Romain",
      "type": "users_segment",
      "created_at": "2016-08-12T14:17:39Z",
      "updated_at": "2016-10-21T07:39:01Z"
    },
    {
      "id": "572091bf13440a016c00002b",
      "name": "Views Products Frequently",
      "type": "users_segment",
      "created_at": "2016-04-27T10:17:35Z",
      "updated_at": "2016-12-01T10:51:24Z"
    }
  ],

  // List of events captured since last Notification
  "events": [
    {
      "context": {
        "location": {
          "latitude": 48.8628,
          "longitude": 2.3292
        },
        "page": {
          "url": "https://hull-2.myshopify.com/products/suspendisse-congue-sodales-massa-sit-amet-euismod-aliquet-sapien-non-dictum"
        }
      },
      "created_at": "2017-01-11T17:52:11Z",
      "event": "Viewed Product",
      "event_source": "track",
      "event_type": "track",
      "properties": {
        "category": "luctus",
        "id": 2986706563,
        "name": "Black Cat Classic Espresso",
        "price": 25
      }
    }
  ],

  // Changes since last Notification
  "changes": {
    "user": {
      "traits_hubspot/fetched_at": [ "2016-12-09T10:47:13Z", "2017-01-10T16:40:30Z" ],
      "traits_hubspot/updated_at": [ "2016-12-09T10:46:03+00:00", "2017-01-10T16:37:55+00:00" ]
    },
    "segments": {
      "entered": [
        {
          "id": "572091bf13440a016c00002b",
          "name": "Views Products Frequently",
          "type": "users_segment",
          "created_at": "2016-04-27T10:17:35Z",
          "updated_at": "2016-12-01T10:51:24Z"
        }
      ],
      "left": [
        {
          "created_at": "2016-02-03T10:47:07Z",
          "id": "56b1daab5580c06798000051",
          "name": "Approved users",
          "type": "users_segment",
          "updated_at": "2016-12-01T10:57:30Z"
        }
      ]
    },
    "is_new": false
  },
  "event": "user:update",
  "timestamp": "2017-01-10T16:41:00.831Z"
}
```

### BatchHandler()

BatchHandler is a packaged solution to receive Batches of Users. It's built to be used as an express route. Hull will receive notifications if your ship's `manifest.json` exposes a `batch` tag in `tags`:

```json
{
  "tags" : [ "batch" ]
}
```

Here is how to use it:

```js
const app = express();
import { BatchHandler } from 'hull';

const handler = BatchHandler({
  groupTraits: false,
  handler: function(notifications=[], context) {
    //notifications itms are the same format as individual notifications from NotifHandler, but only contain a `message` object containing the user.
    //Context is the same as in NotifHandler
    notifications.map(n => updateUser(n, context));
}
})

app.use(Hull.Middleware({ hostSecret }));
app.post('/batch', handler);
```

### OAuthHandler()

OAuth Handler is a packaged authentication handler using [Passport](http://passportjs.org/). You give it the right parameters, it handles the entire auth scenario for you.

It exposes hooks to check if the ship is Set up correctly, inject additional parameters during login, and save the returned settings during callback.

Here is how to use it:

```js
import Hull from "hull";
import { Strategy as HubspotStrategy } from "passport-hubspot";
import { renderFile } from "ejs";
import express from "express";


app.set("views", `${__dirname}/../views`);
app.set("view engine", "ejs");
app.engine("html", renderFile);
app.use(express.static(path.resolve(__dirname, "..", "dist")));
app.use(express.static(path.resolve(__dirname, "..", "assets")));

const { OAuthHandler } = Hull;

app.use(Hull.Middleware({ hostSecret }));
app.use("/auth", OAuthHandler({
  name: "Hubspot",
  tokenInUrl: true,
  Strategy: HubspotStrategy,
  options: {
    clientID: "xxxxxxxxx",
    clientSecret: "xxxxxxxxx", //Client Secret
    scope: ["offline", "contacts-rw", "events-rw"] //App Scope
  },
  isSetup(req, { /* hull,*/ ship }) {
    if (!!req.query.reset) return Promise.reject();
    const { token } = ship.private_settings || {};
    return (!!token) ? Promise.resolve({ valid: true, total: 2}) : Promise.reject({ valid: false, total: 0});
  },
  onLogin: (req, { hull, ship }) => {
    req.authParams = { ...req.body, ...req.query };
    return save(hull, ship, {
      portalId: req.authParams.portalId
    });
  },
  onAuthorize: (req, { hull, ship }) => {
    const { refreshToken, accessToken } = (req.account || {});
    return save(hull, ship, {
      refresh_token: refreshToken,
      token: accessToken
    });
  },
  views: {
    login: "login.html",
    home: "home.html",
    failure: "failure.html",
    success: "success.html"
  },
}));
```


#### manifest.json
```json
{
  "admin" : "/auth/",
}
```
#### Params:

##### name
The name displayed to the User in the various screens.

##### tokenInUrl

Some services (like Stripe) require an exact URL match.
Some others (like Hubspot) don't pass the state back on the other hand.

Setting this flag to false (default: true) removes the `token` Querystring parameter in the URL to only rely on the `state` param. 

##### Strategy
A Passport Strategy.

##### options
An options hash passed to Passport to configure the OAuth Strategy. (See [Passport OAuth Configuration](http://passportjs.org/docs/oauth))

##### isSetup()
A method returning a Promise, resolved if the ship is correctly setup, or rejected if it needs to display the Login screen.

Lets you define in the Ship the name of the parameters you need to check for.

You can return parameters in the Promise resolve and reject methods, that will be passed to the view. This lets you display status and show buttons and more to the customer

##### onLogin()
A method returning a Promise, resolved when ready.

Best used to process form parameters, and place them in `req.authParams` to be submitted to the Login sequence. Useful to add strategy-specific parameters, such as a portal ID for Hubspot for instance.

##### onAuthorize()

A method returning a Promise, resolved when complete.
Best used to save tokens and continue the sequence once saved.

##### views

Required, A hash of view files for the different screens.
Each view will receive the following data:

```js
views: {
  login: "login.html",
  home: "home.html",
  failure: "failure.html",
  success: "success.html"
}
//each view will receive the following data:
{
  name: "The name passed as handler",
  urls: {
    login: '/auth/login',
    success: '/auth/success',
    failure: '/auth/failure',
    home: '/auth/home',
  },
  ship: ship //The entire Ship instance's config
}
```


### serviceMiddleware
This is a middleware which helps to inject the custom ship modules to the request object.
Thanks to that, all the custom functions and classes are automatically bind to the context object:

```js
import { serviceMiddleware } from "hull/lib/ship/util";

const app = express();

app.use(Hull.Middleware({ hostSecret }));
app.use(serviceMiddleware({
  getSegmentIds: (ctx, customParams = {}) => {
    ctx.client.get("/segments", customParams)
      .then(segments => {
        return segments.map(s => s.id);
      });
  },
  customClass: class CustomClass {
    constructor(ctx) {
      this.ctx = ctx;
    }
  }
}))

app.post("/get-segments", (req, res) => {
  const { service } = req.hull;

  service.getSegmentIds({ limit: 500 })
    .then((segments) => res.json(segments), () => res.end)
})
```

### exitHandler
This is a module to simplify grace shutdown of the application. Two infrastrcture services needs to be notified about the exit event:

- `Queue` - to drain and stop the current queue processing
- `Batcher` which needs to flush all pending data.
