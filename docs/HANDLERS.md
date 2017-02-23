# Handlers

In addition to the Applications the toolkit provides a variety of the utilities to perform most common actions of the ship. Following list of handlers includes a prebuild Express routers which performs most common operations of connectors. 

### actionHandler() `incoming`
This is the simplest requests handler to expose custom logic through custom API POST endpoint. The possible usage is triggering a custom operation (like fetching historical data) or a webhook. Both cases handle data `incoming` into Hull platform. However in case of busy webhook it's better to use `batcherHandler` which automatically group the incoming requests into batches.

```js
const app = new Hull.App({}).server();
import { actionHandler } from "hull/lib/utils";

app.use("/fetch-all", actionHandler((ctx, { query, body }) => {
  const { hull, ship } = ctx;

  const { api_token } = ship.private_settings;
  const serviceClient = new ServiceClient(api_token);
  return serviceClient.getHistoricalData()
    .then(users => {
      users.map(u => {
        hull.as({ email: u.email }).traits({
          new_trait: u.custom_value
        });
      });
    });
}));
```

### batcherHandler() `incoming`
The second `incoming` handler which works in a simillar way as `actionHandler` but it also groups incoming requests into batches of selected size:

```js
const app = new Hull.App({}).server();
import { batcherHandler } from "hull/lib/utils";

app.use("/fetch-all", batcherHandler((ctx, requests) => {
  requests.map(request => {
    console.log(request); // { query, body }
  })
}, {
  maxSize: 100, // maximum size of the batch
  maxTime: 1000 // time time in milliseconds to flush batch after the first item came in
}));
```

### notifHandler() `outgoing`

NotifHandler is a packaged solution to receive User and Segment Notifications from Hull. It's built to be used as an express route. Hull will receive notifications if your ship's `manifest.json` exposes a `subscriptions` key:

```json
{
  "subscriptions" : [ { "url" : "/notify" } ]
}
```

Here's how to use it.

```js
const app = new Hull.App({}).server();
import { notifHandler } from "hull/lib/utils";

const handler = NotifHandler({
  userHandlerOptions: {
    groupTraits: true, // groups traits as in below examples
    maxSize: 6,
    maxTime: 10000
  },
  onSubscribe() {} // called when a new subscription is installed
  handlers: {
    "ship:update": function(ctx, messages = []) {},
    "segment:update": function(ctx, messages = []) {},
    "segment:delete": function(ctx, messages = []) {},
    "user:update" : function(ctx, messages = []) {
      console.log('Event Handler here', ctx, messages);
      // ctx: Context Object, see docs above
      // messages: [{
      //   user: { id: '123', ... },
      //   segments: [{}],
      //   changes: {},
      //   events: [{}, {}]
      // }]
    }
  }
})

app.use('/notify', handler);
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

### batchHandler() `outgoing`

BatchHandler is a packaged solution to receive Batches of Users. It's built to be used as an express route. Hull will receive notifications if your ship's `manifest.json` exposes a `batch` tag in `tags`:

```json
{
  "tags" : [ "batch" ]
}
```

Here is how to use it:

```js
const app = new Hull.App({}).server();
import { batchHandler } from "hull/lib/utils";

const handler = BatchHandler(function(context = {}, users = []) {
  // Context is the main Context object
  // user object (see notifHandler docs)
  users.map(u => updateUser(context, u));
}, {
  groupTraits: false,
  batchSize: 100 // the maximum size of users array
});

app.use('/batch', handler);
```

### oAuthHandler()

OAuthHandler is a packaged authentication handler using [Passport](http://passportjs.org/). You give it the right parameters, it handles the entire auth scenario for you.

It exposes hooks to check if the ship is Set up correctly, inject additional parameters during login, and save the returned settings during callback.

Here is how to use it:

```js
import Hull from "hull";
import { oAuthHandler } from "hull/src/utils";
import { Strategy as HubspotStrategy } from "passport-hubspot";

const app = new Hull.App({}).server();

app.use("/auth", OAuthHandler({
  name: "Hubspot",
  tokenInUrl: true,
  Strategy: HubspotStrategy,
  options: {
    clientID: "xxxxxxxxx",
    clientSecret: "xxxxxxxxx", //Client Secret
    scope: ["offline", "contacts-rw", "events-rw"] //App Scope
  },
  isSetup(req) {
    if (!!req.query.reset) return Promise.reject();
    const { token } = req.hull.ship.private_settings || {};
    return (!!token) ? Promise.resolve({ valid: true, total: 2}) : Promise.reject({ valid: false, total: 0});
  },
  onLogin: (req) => {
    req.authParams = { ...req.body, ...req.query };
    return req.hull.client.updateSettings({
      portalId: req.authParams.portalId
    });
  },
  onAuthorize: (req) => {
    const { refreshToken, accessToken } = (req.account || {});
    return req.hull.client.updateSettings({
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
