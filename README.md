# Overview

- [Hull Client](#hull)
    > Most low level Hull Platform API client: `const hull = new Hull({ configuration })`
- [Hull Middleware](#hullmiddleware)
    > A bridge between Hull Client and a NodeJS HTTP application (e.g. express) which initializes context for every HTTP request:
    > `app.use(Hull.Middleware({ configuration }))`
- [Hull Connector](#hullconnector)
    > A complete toolkit to operate with Hull Client in request handlers. Includes Hull Middleware and a set of official patterns to build highly scalable and efficient Connectors:
    > `const connector = new Hull.Connector({ configuration })`

![hull node core components](docs/assets/hull-node-components.png)

---

# Hull

This library makes it easy to interact with the Hull API, send tracking and properties and handle Server-side Events we send to installed Ships.

Creating a new Hull client is pretty straightforward:

```js
import Hull from 'hull';

const client = new Hull({
  id: 'HULL_ID',
  secret: 'HULL_SECRET',
  organization: 'HULL_ORGANIZATION_DOMAIN'
});
```

## Calling the API

Once you have instantiated a client, you can use one of the `get`, `post`,
`put`or `delete` methods to perform actions of our APIs.

```js
// client.api.get works too.
const params = {};
client.get(path, params).then(function(data) {
  console.log(response);
}, function(err, response) {
  console.log(err);
});
```

The first parameter is the route, the second is the set of parameters you want
to send with the request. They all return Promises so you can use the `.then()` syntax if you're more inclined.

### options

Every API client method `get`, `post`, `put` and `delete` accepts two options `timeout` and `retry`:

```js
client.get(path, {}, {
  timeout: 10000,
  retry: 5000
});
```

* **timeout** - option controls if the client should retry the request if the client timeout error happens or if there is an error 503 returned serverside - the value of the option is applied for client side error
* **retry** - controls the time between timeout or 503 error occurence and the next retry being done

## Instance Methods

### client.configuration()

Returns the global configuration object.

```js
client.configuration();
// returns:
{ prefix: '/api/v1',
  domain: 'hullapp.io',
  protocol: 'https',
  id: '58765f7de3aa14001999',
  secret: '12347asc855041674dc961af50fc1',
  organization: 'fa4321.hullapp.io',
  version: '0.11.3' }
```


### client.userToken()

```js
client.userToken({ email:'xxx@example.com', name:'FooBar' }, optionalClaims);
```

Used for [Bring your own users](http://hull.io/docs/users/byou).
Creates a signed string for the user passed in hash. `userHash` needs an `email` field.
[You can then pass this client-side to Hull.js](http://www.hull.io/docs/users/byou) to authenticate users client-side and cross-domain

### client.currentUserId()

```js
client.currentUserId(userId, userSig)
```

Checks the validity of the signature relatively to a user id

### client.currentUserMiddleware()

```js
const app = express();

// a middleware with no mount path; gets executed for every request to the app
app.use(client.currentUserMiddleware);
app.use(function(req, res, next) {
  console.log(req.hull.userId); // Should exist if there is a user logged in;
});
```

Reverse of Bring your own Users. When using Hull's Identity management, tells you who the current user is. Generates a middleware to add to your Connect/Express apps.

## Impersonating a User - client.asUser()

One of the more frequent use case is to perform API calls with the identity of a given user. We provide several methods to do so.

```js
// if you have a user id from your database, use the `external_id` field
const user = client.asUser({ external_id: "dkjf565wd654e" });

// if you have a Hull Internal User Id:
const user = client.asUser({ id: "5718b59b7a85ebf20e000169" });
// or just as a string:
const user = client.asUser("5718b59b7a85ebf20e000169");

// you can optionally pass additional user resolution options as a second argument:
const user = client.asUser({ id: "5718b59b7a85ebf20e000169" }, { create: false });

// Constant `user` is an instance of Hull, scoped to a specific user.
user.get("/me").then(function(me) {
  console.log(me);
});
user.userToken();
```

You can use an internal Hull `id`, an ID from your database that we call `external_id`, an `email` address or `anonymous_id`.

Assigning the `user` variable doesn't make an API call, it scopes the calls to another instance of `hull` client. This means `user` is an instance of the `hull` client scoped to this user.

The second parameter lets you define additional options (JWT claims) passed to the user resolution script:

* **create** - *boolean* - marks if the user should be lazily created if not found (default: *true*)

### Possible usage
> Return a hull `client` scoped to the user identified by it's Hull ID. Not lazily created. Needs an existing User

```js
client.asUser(userId);
```

> Return a hull `client` scoped to the user identified by it's Social network ID. Lazily created if [Guest Users](http://www.hull.io/docs/users/guest_users) are enabled

```js
client.asUser('instagram|facebook|google:userId');
```

> Return a hull `client` scoped to the user identified by it's External ID (from your dashboard). Lazily created if [Guest Users](http://www.hull.io/docs/users/guest_users) are enabled

```js
client.asUser({ external_id: 'externalId' });
```

> Return a hull `client` scoped to the user identified by it's External ID (from your dashboard). Lazily created if [Guest Users](http://www.hull.io/docs/users/guest_users) are enabled

```js
client.asUser({ anonymous_id: 'anonymousId' });
```

> Return a hull `client` scoped to the user identified by only by an anonymousId. Lets you start tracking and storing properties from a user before you have a UserID ready for him. Lazily created if [Guest Users](http://www.hull.io/docs/users/guest_users) are enabled
> When you have a UserId, just pass both to link them.

```js
client.asUser({ email: "user@email.com" });
```


## Methods for user-scoped instance

```js
const externalId = "dkjf565wd654e";
const anonymousId = "44564-EJVWE-1CE56SE-SDVE879VW8D4";

const user = client.asUser({ external_id: externalId, anonymous_id: anonymousId });
```

When you do this, you get a new client that has a different behaviour. It's now behaving as a User would. It means it does API calls as a user and has new methods to track and store properties

### user.track(event, props, context)

Stores a new event.

```js
user.track('new support ticket', { messages: 3,
  priority:'high'
}, {
  source: 'zendesk',
  type: 'ticket',
  event_id: 'uuid1234' //Pass a unique ID to ensure event de-duplication
  ip: null, //don't store ip - it's a server call
  referer: null, //don't store referer - it's a server call
  created_at: '2013-02-08 09:30:26.123+07:00' //ISO 8601. moment.js does it very well
});
```

The `context` object lets you define event meta-data. Everything is optional

- **source**: Defines a namespace, such as `zendesk`, `mailchimp`, `stripe`
- **type**: Define a event type, such as `mail`, `ticket`, `payment`
- **created_at**: Define an event date. defaults to `now()`
- **event_id**: Define a way to de-duplicate events. If you pass events with the same unique `event_id`, they will overwrite the previous one.
- **ip**: Define the Event's IP. Set to `null` if you're storing a server call, otherwise, geoIP will locate this event.
- **referer**: Define the Referer. `null` for server calls.


### user.traits(properties, context)

Stores Attributes on the user:

```js
user.traits({
  opened_tickets: 12
}, { source: 'zendesk' });
// 'source' is optional. Will store the traits grouped under the source name.
// Alternatively, you can send properties for multiple groups with the flat syntax:
user.traits({ "zendesk/opened_tickets": 12, "clearbit/name": "foo" });
```

By default the `traits` calls are grouped in background and send to the Hull API in batches, that will cause some small delay. If you need to be sure the properties are set immediately on the user, you can use the context param `{ sync: true }`.

```js
user.traits({
  fetched_at: new Date().toISOString()
}, {
  source: 'mailchimp',
  sync: true
});
```

To update `last_known_ip` on a selected user an `ip` param can be passed to the context:

```js
user.traits({
  foo: "bar"
}, {
  ip: "192.168.0.1"
})
```

## Utils

### traits.group()

The Hull API returns traits in a "flat" format, with '/' delimiters in the key.
`client.utils.traits.group(user_report)` can be used to group those traits into subobjects:

```js
import { group: groupTraits } from "hull/trait";

groupTraits({
  'email': 'romain@user',
  'name': 'name',
  'traits_coconut_name': 'coconut',
  'traits_coconut_size': 'large',
  'traits_cb/twitter_bio': 'parisian',
  'traits_cb/twitter_name': 'parisian',
  'traits_group/name': 'groupname',
  'traits_zendesk/open_tickets': 18
});
// returns
{
  'id' : '31628736813n1283',
  'email': 'romain@user',
  'name': 'name',
  'traits': {
    'coconut_name': 'coconut',
    'coconut_size': 'large'
  },
  cb: {
    'twitter_bio': 'parisian',
    'twitter_name': 'parisian'
  },
  group: {
    'name': 'groupname',
  },
  zendesk: {
    'open_tickets': 18
  }
};
```

This utility can be also used in following way:

```js
const client = new Hull({ config });
const userGroupedTraits = client.utils.traits.group(user_report);
```

### extract.request()

```js
client.utils.extract.request({
  hostname: "https://some-public-url.com",
  fields: ["first_name", "last_name"],
  segment: {
    id: "54321"
  }
});
```

Performs a `client.post("extract/user_reports", {})` call, building all needed properties for the action. It takes following arguments:

- **hostname** - a hostname where the extract should be sent
- **path** - a path of the endpoint which will handle the extract (default: *batch*)
- **fields** - an array of users attributes to extract (default: *[]*)
- **format** - prefered format (default: *json*)
- **segment** - extract only users matching selected segment, this needs to be an object with `id` at least, `segment.query` is optional

### extract.handle()

The utility to download and parse the incoming extract.

```js
client.utils.extract.handle({
  body: req.body,
  batchSize: 50, // get 50 users at once
  handler: (users) => {
    assert(users.length <= 50);
  }
});

```

- **body** - json of incoming extract message - must contain `url` and `format`
- **batchSize** - number of users to be passed to each handler call
- **handler** - the callback function which would be called with batches of users

### settings.update()
A helper utility which simplify `hull.put("app", { private_settings })` calls. Using raw API you need to merge existing settings with those you want to update.
This utility does it for you.

```js
const client = new Hull({ config });

client.get("app")
  .then(ship => {
    assert.equal(ship.private_settings.existing_property, "foo");
    return client.utils.settings.update({ new_property: "bar"});
  })
  .then(() => client.get("app"))
  .then(ship => {
    assert.equal(ship.private_settings.existing_property, "foo");
    assert.equal(ship.private_settings.new_property, "bar");
  });
```

### properties.get()
A wrapper over `client.get("search/user_reports/bootstrap")` call which unpacks the list of properties.

```js
client.utils.properties.get()
  .then(properties => {
    console.log(properties); // see result below
  });

{
  "id": {
    "id": "id",
    "text": "Hull ID",
    "type": "string",
    "id_path": [
      "User"
    ],
    "path": [
      "User"
    ],
    "title": "Hull ID",
    "key": "id"
  },
  "created_at": {
    "id": "created_at",
    "text": "Signup on",
    "type": "date",
    "id_path": [
      "User"
    ],
    "path": [
      "User"
    ],
    "title": "Signup on",
    "key": "created_at"
  }
}
```


## Logging Methods

The Logger comes in two flavors, `Hull.logger.xxx` and `hull.logger.xxx` - The first one is a generic logger, the second one injects the current instance of `Hull` so you can retreive ship name, id and organization for more precision.

Uses [Winston](https://github.com/winstonjs/winston)

```js
Hull.logger.info("message", { object }); //Class logging method,
client.logger.info("message", { object }); //Instance logging method, adds Ship ID and Organization to Context. Use if available.

//Debug works the same way but only logs if process.env.DEBUG===true
Hull.logger.info("message", { object }); //Class logging method,
client.logger.info("message", { object });

//You can add more logging destinations like this:
import winstonSlacker from "winston-slacker";
Hull.logger.add(winstonSlacker,  { ... });

```


---

# Hull.Middleware
This middleware standardizes the instantiation of a [Hull Client](#hull) in the context of authorized HTTP request. It also fetches the entire ship's configuration.

**Example usage:**

```js
import Hull from "hull";
import express from "express";

const app = express();
app.use(Hull.Middleware({ hostSecret: "secret" }));
app.post("/show-segments", (req, res) => {
    req.hull.client.get("/segments")
        .then((segments) => {
            res.json(segments)
        });
});
```

## Options

* **hostSecret**
    > The ship hosted secret - consider this as a private key which is used to encrypt and decrypt `req.hull.token`. The token is useful for exposing it outside the Connector <-> Hull Platform communication. For example the OAuth flow or webhooks. Thanks to the encryption no 3rd party will get access to Hull Platform credentials.

* **clientConfig**
    > Additional config which will be passed to the new instance of Hull Client

## Basic Context Object

The Hull Middleware operates on `req.hull` object. It uses it to setup the Hull Client and decide which configuration to pick - this are the core parameters the Middleware touches:

* **req.hull.config**
    > an object carrying `id`, `secret` and `organization`. You can setup it prior to the Hull Middleware execution (via custom middleware) to ovewrite default configuration strategy
* **req.hull.token**
    > an encrypted version of configuration. If it's already set in the request, Hull Middleware will try to decrypt it and get configuration from it. If it's not available at the beginning and middleware resolved the configuration from other sources it will encrypt it and set `req.hull.token` value.

    > When the connector needs to send the information outside the Hull ecosystem it must use the token, not to expose the raw credentials. The usual places where it happens are:
    * dashboard pane links
    * oAuth flow (callback url)
    * external webhooks
* **req.hull.client**
    > [Hull API client](#hull) initialized to work with current organization.
* **req.hull.ship**
    > ship object with manifest information and `private_settings` fetched from Hull Platform.
* **req.hull.hostname**
    > Hostname of the current request. Since the connector are stateless services this information allows the connector to know it's public address.

## Operations - configuration resolve strategy

Here is what happens when your Express app receives a query.

1. If a config object is found in `req.hull.config` steps **2** and **3** are skipped. 
2. If a token is present in `req.hull.token`, the middleware will try to use the `hostSecret` to decrypt it and set `req.hull.config`.
3. If the query string (`req.query`) contains `id`, `secret`, `organization`, they will be stored in `req.hull.config`.
4. After this, if a valid configuration is available in `req.hull.config`, a Hull Client instance will be created and stored in `req.hull.client`.
5. When this is done, then the Ship will be fetched and stored in `req.hull.ship`
    > If there is a `req.hull.cache` registered in the Request Context Object, it will be used to cache the ship object. For more details see [Context Object Documentation](#context)
6. If the configuration or the secret is invalid, an error will be thrown that you can catch using express error handlers.

---

# Hull.Connector
The connector is a simple HTTP application served from public address. It could be implemented in any way and in any technological stack unless it implements the same API:

```js
const app = express();
app.get("/manifest.json", serveTheManifestJson);
app.listen(port);
```

Yet to ease the connector development and to extract common code base the `hull-node` library comes with the **Hull.Connector** toolkit which simplify the process of building new connector by a set of helpers and utilities which follows the same convention.

## Initialization
```js
import Hull from "hull";

const connector = new Hull.Connector({
    port: 1234, // port to start express app on
    hostSecret: "secret",  // a secret generated random string used as a private key
    segmentFilterSetting: "synchronized_segments" // name of the connector private setting which has information about filtered segments
});
```

This is the instance of the `Connector` module which exposes a set of utilities which can be applied to the main [express](http://expressjs.com/) app. The utilities can be taken one-by-one and applied the the application manually or there are two helper method exposed which applies everything be default:

## Setup Helpers
Setup Helpers are two high-level methods exposed by initialized Connector instance to apply custom middlewares to the Express application. Those middlewares enrich the application with connector features.

```js
import express from "express";
import Hull from "hull";

const app = express();
const connector = new Hull.Connector({ hostSecret });

connector.setupApp(app); // apply connector related features to the application
app.post("/fetch-all", (req, res) => {
  res.end("ok");
});
connector.startApp(app, port); // internally calls app.listen
```

### setupApp(express app)
This method applies all features of `Hull.Connector` to the provided application:

- serving `/manifest.json`, `/readme` and `/` endpoints
- serving static assets from `/dist` and `/assets` directiories
- rendering `/views/*.html` files with `ejs` renderer
- timeouting all requests after 25 seconds
- adding Newrelic and Sentry instrumentation
- initiating the wole [Context Object](#context)
- handling the `hullToken` parameter in a default way


### startApp(express app)
This is a supplement method which calls `app.listen` internally and also terminates instrumentation of the application calls.

## Bare express application
If you prefer working with the express app directly and have full control over how modules from `Hull.Connector` alter the behaviour of the application, you can pick them directly.
Calling the `setupApp` and `startApp` is effectively equal to the following setup:

```js
import { renderFile } from "ejs";
import timeout from "connect-timeout";
import { staticRouter } from "hull/lib/utils";

app.engine("html", renderFile); // render engine
app.set("views", `${process.cwd()}/views`);
app.set("view engine", "ejs");

app.use(timeout("25s")); // make sure that we will close the connection before heroku does
app.use(connector.instrumentation.startMiddleware()); // starts express app instrumentation
app.use(connector.instrumentation.contextMiddleware()); // adds `req.hull.metric`
app.use(connector.queue.contextMiddleware()); // adds `req.hull.enqueue`
app.use(connector.cache.contextMiddleware()); // adds `req.hull.cache`
app.use((req, res, next) => {
    // must set `req.hull.token` from request
    req.hull.token = req.query.hullToken;
});
app.use(connector.notifMiddleware()); // parses the incoming sns message, so the clientMiddleware knows if to bust the cache
app.use(connector.clientMiddleware()); // sets `req.hull.client` and `req.hull.ship`
app.use("/", staticRouter());

// add your routes here:
app.post("/fetch-all", (req, res) => {
  res.end("ok");
});


app.use(connector.instrumentation.stopMiddleware()); // stops instrumentation
// start the application
app.listen(port, () => {
});
```

Here somes the detailed description of the utilities.

### notifMiddleware()
Runs `bodyParser.json()` and if the incoming requests is a Hull notification it verifies the incoming data and set `req.hull.message` with the raw information and `req.hull.notification` with parsed data.

### clientMiddleware()
This is a wrapper over `Hull.Middleware` whith `hostSecret` and other configuration options bound.
The middleware initializes the Hull API client: `req.hull.client = new Hull({});` using credentials from (in order) `req.hull.config`, `req.hull.token` `req.hull.query`.

### instrumentation.contextMiddleware()
Adds `req.hull.metric` for details see [Context Object](#context) documentation.

### queue.contextMiddleware()
Adds `req.hull.enqueue` for details see [Context Object](#context) documentation.

### cache.contextMiddleware()
Adds `req.hull.cache` for details see [Context Object](#context) documentation.

### instrumentation.startMiddleware()
Instrument the requests in case of exceptions. More details about instrumentation [here](#infrastructure).

### instrumentation.stopMiddleware()
Instrument the requests in case of exceptions. More details about instrumentation [here](#infrastructure).


## Worker
More complex connector usually needs a background worker to split its operation into smaller tasks to spread the workload:

```js
import express from "express";
import Hull from "hull";

const app = express();

const connector = new Hull.Connector({ hostSecret });
// apply connector related features to the application
connector.setupApp(app);

connector.worker({
    customJob: (ctx, payload) => {
        // process payload.users
    }
})
app.post("/fetch-all", (req, res) => {
    req.hull.enqueue("customJob", { users: [] });
});
connector.startApp(app, port);
connector.startWorker(queueName = "queueApp");
```

## Infrastructure
The connector internally uses infrastructure modules to support its operation:
- Instrumentation (for metrics)
- Queue (for internal queueing purposes)
- Cache (for caching ship object and segment lists)
- Batcher (for internal incoming traffing grouping)

[Read more](#infrastructure) how configure them.

## Utilities
Above documentation shows the basic how to setup and run the `Hull.Connector` and the express application. To implement the custom connector logic, this library comes with a set of utilities to perform most common operations.

[Here is the full list >>](#utils)


## Custom middleware
The `Hull.Connector` architecture gives a developer 3 places to inject custom middleware:

1. At the very beginning of the middleware stack - just after `const app = express();` - this is a good place to initialy modify the incoming request, e.g. set the `req.hull.token` from custom property
2. After the [Context Object](context.md) is built - after calling `setupApp(app)` - all context object would be initiated, but `req.hull.client`, `req.hull.segments` and `req.hull.ship` will be present **only if** credentials are passed. To ensure the presence of these properties [requireHullMiddleware](connector-utils.md#requirehullmiddleware) can be used.
3. Before the closing `startApp(app)` call which internally calls `app.listen()`

> **NOTE:** every `Handler` provided by this library internally uses [requireHullMiddleware](connector-utils.md#requirehullmiddleware) and [responseMiddleware](connector-utils.md#responsemiddleware) to wrap the provided callback function. Have it in mind while adding custom middlewares at the app and router level.

---

# Context object
[Hull.Connector]($hullconnector) and [Hull.Middleware](#hullmiddleware) applies multiple middlewares to the request handler.
The result is `req.hull` object which is the **Context Object** - a set of modules to work in the context of current organization and connector instance.

The core part of the **Context Object** is described in [Hull Middleware documentation](#hullmiddleware).

```javascript
{
  // set by Hull.Middleware
  config: {},
  token: "",
  client: {
    logger: {},
  },
  ship: {},
  hostname: req.hostname,
  params: req.query + req.body,

  // set by Hull.Connector
  connectorConfig: {},
  segments: [],
  cache: {},
  enqueue: () => {},
  metric: {},
  helpers: {},
  service: {},
  message: {},
  notification: {}
}
```


* **connectorConfig**
  > Hash with connector settings, details [here](#hullconnector)


* **segments**
  > An array of segments defined at the organization, it's being automatically exposed to the context object
  ```json
  [{
      name: "Segment name",
      id: "123abc"
  }]
  ```

* **cache**
  > Since every connector can possibly work on high volumes of data performing and handling big number of requests. Internally the cache is picked by the `Hull Middleware` to store the `ship object` and by `segmentsMiddleware` to store `segments list`. The cache can be also used for other purposes, e.g. for minimizing the External API calls. `Caching Module` is exposing three public methods:
  ```js
  ctx.cache.get("object_name");
  ctx.cache.set("object_name", object_value);
  ctx.cache.wrap("object_name", () => {
      return Promise.resolve(object_value)
  });
  ```

* **enqueue**
  > A function added to context by `Queue Module`. It allows to perform tasks in an async manner. The queue is processed in background in a sequential way, it allows to:
  + respond quickly in the express application actions (they just queue the work)
  + split the workload into smaller chunks (e.g. for extract parsing)
  + control the concurrency - most of the SERVICE APIs have rate limits

  - **options.queueName** - when you start worker with a different queue name, you can explicitly set it here to queue specific jobs to that queue

  ```js
  req.hull.enqueue("jobName", { user: [] }, options = {});
  ```

* **metric**
  > An object added to context by `Instrumentation Module`. It allows to send data to metrics service. It's being initiated in the right context, and expose following methods:

  ```js
  req.hull.metric.value("metricName", metricValue = 1);
  req.hull.metric.increment("metricName", incrementValue = 1); // increments the metric value
  req.hull.metric.event("eventName", { text = "", properties = {} });
  ```

* **helpers**
  > A set of functions from `connector/helpers` bound to current Context Object. More details [here](#helpers).
  ```js
  req.hull.helpers.filterUserSegments();
  req.hull.helpers.requestExtract();
  req.hull.helpers.setUserSegments();
  ```

* **service**
  > A namespace reserved for connector developer to inject a custom logic. When the connector base code evolves, the best technique to keep it maintainable is to split it into a set of functions or classes. To make it even simpler and straightforward the connector toolkit uses [one convention](#context) to pass the context into the functions and classes.
  The `service` namespace is being built by [this middleware](../src/utils/service-middleware.js), it takes a plain javascript object with the definition of API, that is a list of functions and classes.
  What it injects into the context object is a mapped javscript object with the same keys, bound functions and objects of initiated classes. The binding and initialization does the following:
  - function is bind with the context object as a first argument - `fn.bind(null, ctx)`
  - class is initiated with the context object as a first and only argument to the constructor - `new class(ctx)`

  > Example:

  ```js
  const service = {
      getUserInformation: (ctx, userId) => {
          ctx.ship.private_settings.custom_user_field
      }
  };

  app.get("/action", serviceMiddleware(service), (req, res) => {
      req.getUserInformation(req.query.user_id);
  });
  ```

* **message**
  > Optional - set if there is a sns message incoming. It contains raw, message object - should not be used directly by the connector, `req.hull.notification` is added for that purpose.
  ```js
  Type: "Notification",
  Subject: "user_report:update",
  Message: "{\"user\":{}}"
  ```

* **notification**
  > Optional - if the incoming sns message type if `Notification`, then the messaged is parsed and set to notification. It has following structure:
  ```js
  subject: "user_report:update",
  timestamp: new Date(message.Timestamp),
  paload: { user: {} }
  ```

## Context management convention
The context object is treated by the `Hull.Connector` as a [dependency injection](https://en.wikipedia.org/wiki/Dependency_injection) container which carries on all required dependencies to be used in actions, jobs or custom methods.

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

---

# Helpers

This is a set of additional helper functions being exposed at `req.hull.helpers`. They allow to perform common operation in the context of current request.
They are similar o `req.hull.client.utils`, but operate at higher level, ensure good practises and should be used in the first place before falling back to raw utils.

### updateSettings()
Allows to update selected settings of the ship `private_settings` object.
This is a wrapper over `hull.utils.settings.update()` call. On top of that it makes sure that the current context ship object is updated, and the ship cache is refreshed.

```js
req.hull.helpers.updateSettings({ newSettings });
```

### filterNotification({ notification }, fieldName = "synchronized_segments")
Returns `true/false` based on if the user belongs to any of the segments selected in the settings segment filter. If there are no segments defined it will return `false` for all users.

```js
req.hull.helpers.filterNotification({ notification }, fieldName = "synchronized_segments");
```

### requestExtract()
This is a method to request an extract of user base to be sent back to the Connector to a selected `path` which should be handled by `notifHandler`.

```js
req.hull.helpers.requestExtract({ segment = null, path, fields = [], additionalQuery = {} });
```

## Context
Helpers are just a set of simple functions which take [Context Object](context.md) as a first argument. When being initialized by `Hull.Middleware` their are all bound to the proper object, but the functions can be also used in a standalone manner:

```js
import { updateSettings } from "hull/lib/helpers";

app.post("/request", (req, res) => {
  updateSettings(req.hull, { called: true });
  // or:
  req.hull.helpers.updateSettings({ called: true });
});
```

---

# Infrastrcture
Production ready connectors needs some infrascture modules to support its operations, allow instrumentation, queueing and caching. The [Hull.Connector](#hullconnector) comes with default settings, but also allows to initiate them and set a custom configuration:

```js
const instrumentation = new Instrumentation();
const cache = new Cache();
const queue = new Queue();

const connector = new Hull.Connector({ instrumentation, cache, queue });
```

### Queue
By default it's initiated inside `Hull.Connector` as a very simplistic in-memory queue, but in case of production grade needs, it comes with a [Kue](https://github.com/Automattic/kue) adapter which you can initiate in a following way:

```js
import { Queue } from "hull/lib/infra";

const queue = new Queue("kue", { options });

const connector = new Hull.Connector({ queue });
```

`Options` from the constructor of the `Queue` are passed directly to the `kue.createQueue()` method and can be set with following parameters:
https://github.com/Automattic/kue#redis-connection-settings

The `queue` instance has a `contextMiddleware` method which adds `req.hull.enqueue` method to queue jobs - this is done automatically by `Hull.Connector().setupApp(app)`:

```js
req.hull.enqueue(jobName = "", jobPayload = {}, options = {});
```

**options:**
1. **ttl** - milliseconds
    > Job producers can set an expiry value for the time their job can live in active state, so that if workers didn't reply in timely fashion, Kue will fail it with TTL exceeded error message preventing that job from being stuck in active state and spoiling concurrency.
2. **delay** - milliseconds
    > Delayed jobs may be scheduled to be queued for an arbitrary distance in time by invoking the .delay(ms) method, passing the number of milliseconds relative to now. Alternatively, you can pass a JavaScript Date object with a specific time in the future. This automatically flags the Job as "delayed".
3. **priority** - integer / string:
    ```js
    {
    low: 10,
    normal: 0,
    medium: -5,
    high: -10,
    critical: -15
    }
    ```

By default the job will be retried 3 times and the payload would be removed from queue after successfull completion.

Then the handlers to work on a specific jobs is defined in following way:

```js
connector.worker({
    jobsName: (ctx, jobPayload) => {
        // process Payload
        // this === job (kue job object)
        // return Promise
    }
});
connector.startWorker();
```

### Cache
The default comes with the basic in-memory store, but in case of distributed connectors being run in multiple processes for reliable operation a shared cache solution should be used. The `Cache` module internally uses [node-cache-manager](https://github.com/BryanDonovan/node-cache-manager), so any of it's compatibile store like `redis` or `memcache` could be used:

```js
import redisStore from "cache-manager-redis";
import { Cache } from "hull/lib/infra";

const cache = new Cache({
    store: redisStore,
    url: 'redis://:XXXX@localhost:6379/0?ttl=600'
});

const connector = new Hull.Connector({ cache });
```


The `cache` instance also exposes `contextMiddleware` whch adds `req.hull.cache` to store the ship and segments information in the cache to not fetch it for every request. The `req.hull.cache` is automatically picked and used by the `Hull.Middleware` and `segmentsMiddleware`.

The `req.hull.cache` can be used by the connector developer for any other caching purposes:

```js
ctx.cache.get("object_name");
ctx.cache.set("object_name", object_value);
ctx.cache.wrap("object_name", () => {
    return Promise.resolve(object_value)
});
```

There are two `object names` which are reserved and cannot be used here:

- any ship id
- "segments"

> **IMPORTANT** internal caching of `ctx.ship` object is refreshed on `ship:update` notifications, if the connector doesn't subscribe for notification at all the cache won't be refreshed automatically. In such case disable caching, set short TTL or add [notifHandler](./connector-utils.md#notifhandler).

### Instrumentation
It automatically sends data to DataDog, Sentry and Newrelic if appropriate ENV VARS are set:

- NEW_RELIC_LICENSE_KEY
- DATADOG_API_KEY
- SENTRY_URL

It also exposes the `contextMiddleware` which adds `req.hull.metric` agent to add custom metrics to the ship. Right now it doesn't take any custom options, but it's showed here for the sake of completeness.

```js
import { Instrumentation } from "hull/lib/infra";

const instrumentation = new Instrumentation();

const connector = new Connector.App({ instrumentation });
```

### Handling the process shutdown
Two infrastrcture services needs to be notified about the exit event:

- `Queue` - to drain and stop the current queue processing
- `Batcher` - to flush all pending data.

---

# Connector Utilities
In addition to the [Connector toolkit](connector.md) the library provides a variety of the utilities to perform most common actions of the ship. Following list of handlers and middleware helps in performing most common connector operations.

### actionHandler()
This is the simplest requests handler to expose custom logic through an API POST endpoint. The possible usage is triggering a custom operation (like fetching historical data) or a webhook. Both cases handle incoming flow data into Hull platform. However in case of busy webhook it's better to use [batcherHandler](#batcherhandler) which automatically group the incoming requests into batches.

```js
import { actionHandler } from "hull/lib/utils";
const app = express();

app.use("/fetch-all", actionHandler((ctx, { query, body }) => {
  const { client, ship } = ctx;

  const { api_token } = ship.private_settings;
  const serviceClient = new ServiceClient(api_token);
  return serviceClient.getHistoricalData()
    .then(users => {
      users.map(u => {
        client.asUser({ email: u.email }).traits({
          new_trait: u.custom_value
        });
      });
    });
}));
```

### batcherHandler()
The second `incoming` handler which works in a simillar way as `actionHandler` but it also groups incoming requests into batches of selected size:

```js
import { batcherHandler } from "hull/lib/utils";
const app = express();

app.use("/fetch-all", batcherHandler((ctx, requests) => {
  requests.map(request => {
    console.log(request); // { query, body }
  })
}, {
  maxSize: 100, // maximum size of the batch
  maxTime: 1000 // time time in milliseconds to flush batch after the first item came in
}));
```

### notifHandler()

NotifHandler is a packaged solution to receive User and Segment Notifications from Hull. It's built to be used as an express route. Hull will receive notifications if your ship's `manifest.json` exposes a `subscriptions` key:

```json
{
  "subscriptions" : [ { "url" : "/notify" } ]
}
```

Here's how to use it.

```js
import { notifHandler } from "hull/lib/utils";
const app = express();

const handler = NotifHandler({
  userHandlerOptions: {
    groupTraits: true, // groups traits as in below examples
    maxSize: 6,
    maxTime: 10000,
    segmentFilterSetting: "sychronized_segments"
  },
  onSubscribe() {} // called when a new subscription is installed
  handlers: {
    "ship:update": function(ctx, message) {},
    "segment:update": function(ctx, message) {},
    "segment:delete": function(ctx, message) {},
    "user:update": function(ctx, messages = []) {
      console.log('Event Handler here', ctx, messages);
      // ctx: Context Object
      // messages: [{
      //   user: { id: '123', ... },
      //   segments: [{}],
      //   changes: {},
      //   events: [{}, {}]
      //   matchesFilter: true | false
      // }]
    }
  }
})

connector.setupApp(app);
app.use('/notify', handler);
```

For example of the notifications payload [see details](./notifications.md)

**Extracts**

In addition to event notifications Hull supports sending extracts of userbase. These extracts can be triggered via Dashboard manual user action or can be programiatically requested from Connector logic (see [requestExtract helper](./connector-helpers.md#requestextract-segment--null-path-fields---)). The Connector will receive manual batches if your ship's `manifest.json` exposes a `batch` tag in `tags`:

```json
{
  "tags" : [ "batch" ]
}
```

In both cases the batch extract is handled by the `user:update`. The extract is split into smaller chunks using the `userHandlerOptions.maxSize` option. In extract every message will contain only `user` and `segments` information.

In addition to let the `user:update` handler detect whether it is processing a batch extract or notifications there is a third argument passed to that handler - in case of notifications it is `undefined`, otherwise it includes `query` and `body` parameters from req object.

### oAuthHandler()
OAuthHandler is a packaged authentication handler using [Passport](http://passportjs.org/). You give it the right parameters, it handles the entire auth scenario for you.

It exposes hooks to check if the ship is Set up correctly, inject additional parameters during login, and save the returned settings during callback.

Here is how to use it:

```js
import { oAuthHandler } from "hull/lib/utils";
import { Strategy as HubspotStrategy } from "passport-hubspot";

const app = express();

app.use("/auth", oAuthHandler({
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


To make it working in Hull dashboard set following line in **manifest.json** file:

```json
{
  "admin" : "/auth/",
}
```

**parameters:**

* **name**
    > The name displayed to the User in the various screens.
* **tokenInUrl**
    > Some services (like Stripe) require an exact URL match.
    > Some others (like Hubspot) don't pass the state back on the other hand.
    >
    > Setting this flag to false (default: true) removes the `token` Querystring parameter in the URL to only rely on the `state` param.
* **Strategy**
    > A Passport Strategy.
* **options**
    > Hash passed to Passport to configure the OAuth Strategy. (See [Passport OAuth Configuration](http://passportjs.org/docs/oauth))
* **isSetup()**
    > A method returning a Promise, resolved if the ship is correctly setup, or rejected if it needs to display the Login screen.
    >
    > Lets you define in the Ship the name of the parameters you need to check for.
    >
    > You can return parameters in the Promise resolve and reject methods, that will be passed to the view. This lets you display status and show buttons and more to the customer
* **onLogin()**
    > A method returning a Promise, resolved when ready.
    >
    > Best used to process form parameters, and place them in `req.authParams` to be submitted to the Login sequence. Useful to add strategy-specific parameters, such as a portal ID for Hubspot for instance.
* **onAuthorize()**
    > A method returning a Promise, resolved when complete.
    > Best used to save tokens and continue the sequence once saved.
* **views**
    > Required, A hash of view files for the different screens.
    > Each view will receive the following data:
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


### requireHullMiddleware

The middleware which ensures that the Hull Client was successfully setup by the Hull.Middleware:

```js
import { requireHullMiddleware } from "hull/lib/utils";
const app = express();

app.post(
  "/fetch",
  Hull.Middleware({ hostSecret }),
  requireHullMidlleware,
  (req, res) => {
    // we have a guarantee that the req.hull.client
    // is properly set.
    // In case of missing credentials the `requireHullMidlleware`
    // will respond with 403 error
  }
);

```

### responseMiddleware
This middleware helps sending a HTTP response and can be easily integrated with Promise based actions:

Normally one would need to do:

```js
const app = express();

app.post("fetch", ...middleware, (req, res) => {
  performSomeAction()
    .then(
      () => res.end("ok"),
      (err) => {
        req.hull.client.logger.error("fetch.error", err.stack || err);
        res.status(500).end();
      }
    );
});
```

The response middleware takes that instrastructure related code outside, so the action handler can focus on the logic only. It also makes sure that both Promise resolution are handled properly:

```js
import { responseMiddleware } from "hull/lib/utils";
const app = express();

app.post("fetch", ...middleware, (req, res, next) => {
  performSomeAction()
    .then(next, next);
}, responseMiddleware);
```

### serviceMiddleware
This is a middleware which helps to inject the custom ship modules to the request object. Thanks to that, all the custom functions and classes are automatically bound to the context object:

```js
import { serviceMiddleware } from "hull/lib/utils";

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
