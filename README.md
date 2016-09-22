# Node.js client

This library makes it easy to interact with the Hull API, send tracking and properties and handle Server-side Events we send to installed Ships.

## Usage

```js
import Hull from 'hull';

const hull = new Hull({
  id: 'HULL_ID',
  secret: 'HULL_SECRET',
  organization: 'HULL_ORGANIZATION_DOMAIN'
});
```

Creating a new Hull client is pretty straightforward.
In Ship Events, we create and scope one for you to abstract the lifecycle


## Calling the API

```js
//hull.api.get works too.
const params = {}
hull.get(path, params).then(function(data){
  console.log(response);
},function(err, response){
  console.log(err);
});
```

> Once you have instanciated a client, you can use one of the `get`, `post`,
`put`or `delete` methods to perform actions of our APIs.

The first parameter is the route, the second is the set of parameters you want
to send with the request. They all return Promises so you can use the `.then()` syntax if you're more inclined.

# Instance Methods

## hull.configuration()

Returns the global configuration

## hull.userToken()

```js
hull.userToken({email:'xxx@example.com',name:'FooBar'}, claims)
```

Used for [Bring your own users](http://hull.io/docs/users/byou).  
Creates a signed string for the user passed in hash. `userHash` needs an `email` field.  
[You can then pass this client-side to Hull.js](http://www.hull.io/docs/users/byou) to authenticate users client-side and cross-domain

## hull.currentUserId()

```js
hull.currentUserId(userId, userSig)
```

Checks the validity of the signature relatively to a user id

## hull.currentUserMiddleware()

```js
const app = express();

// a middleware with no mount path; gets executed for every request to the app
app.use(hull.currentUserMiddleware);
app.use(function(req,res,next){
  console.log(req.hull.userId) // Should exist if there is a user logged in;  
})
```

Reverse of Bring your own Users. When using Hull's Identity management, tells you who the current user is. Generates a middleware to add to your Connect/Express apps.


## Utils

### hull.utils.groupTraits(user_report)

```js
const hull = new Hull({config});

hull.utils.groupTraits({
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

The Hull API returns traits in a "flat" format, with '/' delimiters in the key.
The Events handler  Returns a grouped version of the traits in the flat user report we return from the API.
> The NotifHandler already does this by default.


# Impersonating a User

```js
//If you only have an anonymous ID, use the `guest_id` field
var user = hull.as({ guest_id: '123456789' });

//if you have a user id from your database, use the `external_id` field
var user = hull.as({ external_id: 'dkjf565wd654e' });

//if you retrieved a Hull Internal User Id:
var user = hull.as('5718b59b7a85ebf20e000169', false);

//second argument is optional and specifies wether we get the user's right or admin rights.
//or with an Instagram or other social service ID:
var user = hull.as('instagram:1234');
//user is an instance of Hull, scoped to a specific user.
//Default is false: "get user rights". 
user.get('/me').then(function(me){
  console.log(me)
});
user.userToken();
//It will act as if the user performed the action if the second parameter is falsy
```

One of the more frequent use case is to perform API calls with the identity of a given user. We provide several methods to do so.

You can use an internal Hull `id`, an Anonymous ID from that we call a `guest_id`, an ID from your database that we call `external_id`, or even the ID from a supported social service such as Instagram;

Assigning the `user` variable doesn't make an API call, it scopes the calls to another instance of `hull` client. This means `user` is an instance of the `hull` client scoped to this user.

The second parameter lets you define whether the calls are perform with Admin rights or the User's rights.


> Return a hull `client` scoped to the user identified by it's Hull ID. Not lazily created. Needs an existing User

```js
hull.as(userId)
```

> Return a hull `client` scoped to the user identified by it's Social network ID. Lazily created if [Guest Users](http://www.hull.io/docs/users/guest_users) are enabled

```js
hull.as('instagram|facebook|google:userId', sudo)
```

> Return a hull `client` scoped to the user identified by it's External ID (from your dashboard). Lazily created if [Guest Users](http://www.hull.io/docs/users/guest_users) are enabled

```js
hull.as({external_id:'externalId'}, sudo)
```

> Return a hull `client` scoped to the user identified by it's External ID (from your dashboard). Lazily created if [Guest Users](http://www.hull.io/docs/users/guest_users) are enabled

```js
hull.as({guest_id:'anonymousId'}, sudo)
```

> Return a hull `client` scoped to the user identified by only by an anonymousId. Lets you start tracking and storing properties from a user before you have a UserID ready for him. Lazily created if [Guest Users](http://www.hull.io/docs/users/guest_users) are enabled
> When you have a UserId, just pass both to link them.

```js
hull.as({email:'user@email.com'}, sudo)
```


# Methods for user-scoped instances

```js
const sudo = true;
const userId = '5718b59b7a85ebf20e000169';
const externalId = 'dkjf565wd654e';
const anonymousId = '44564-EJVWE-1CE56SE-SDVE879VW8D4';

const user = hull.as({external_id: externalId, guest_id: anonymousId})
```

When you do this, you get a new client that has a different behaviour. It's now behaving as a User would. It means it does API calls as a user and has new methods to track and store properties

## user.track(event, props, context)

```js
user.track('new support ticket', { messages: 3,
  priority:'high'  
}, {
  source: 'zendesk',
  ip: null, //don't store ip - it's a server call
  referer: null, //don't store referer - it's a server call
  created_at: '2013-02-08 09:30:26.123+07:00' //ISO 8601. moment.js does it very well 
});
```

Stores a new event, which you can namespace using the `source` property in the `context` parameter

## user.traits(properties, context)

```js
user.traits({
  opened_tickets: 12 
}, { source: 'zendesk' }); 
// 'source' is optional. Will store the traits grouped under the source name.
// Alternatively, you can send properties for multiple groups with the flat syntax:
// user.traits({ "zendesk/opened_tickets": 12, "clearbit/name": "toto"});
```

Stores Properties on the user.

If you need to be sure the properties are set immediately on the user, you can use the context param `{ sync: true }`.


```js
user.traits({
  fetched_at: new Date().toISOString()
}, { source: 'mailchimp', sync: true }); 
```


# Class Methods

### Logging Methods: Hull.logger.debug(), Hull.logger.info() ...


```js
Hull.logger.info("message", { object }); //Class logging method,
hull.logger.info("message", { object }); //Instance logging method, adds Ship ID and Organization to Context. Use if available.

//Debug works the same way but only logs if process.env.DEBUG===true
Hull.logger.info("message", { object }); //Class logging method,
hull.logger.info("message", { object });

//You can add more logging destinations like this:
import winstonSlacker from "winston-slacker";
Hull.logger.add(winstonSlacker,  { ... });

```

Uses [Winston](https://github.com/winstonjs/winston)

The Logger comes in two flavors, `Hull.logger.xxx` and `hull.logger.xxx` - The first one is a generic logger, the second one injects the current instance of `Hull` so you can retreive ship name, id and organization for more precision.

## NotifHandler()

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


app.post('/notify', handler);
```

Your app can subscribe to events from Hull and receive Events via http POST. 
For this we provide a helper called NotifHandler that handles all the complexity of subscribing to events and routing them to specific methods. All you need to do is declare which methods handle what Events.


## BatchHandler()

BatchHandler is a packaged solution to receive Batches of Users. It's built to be used as an express route. Hull will receive notifications if your ship's `manifest.json` exposes a `batch` tag in `tags`:

```json
{
  "tags" : [ "batch" ]
}
```

Here is how to use it: 

```js
const app = express();
import { NotifHandler } from 'hull';

const handler = BatchHandler({
  groupTraits: false,
  handler: function(notifications=[], context) {
    //notifications itms are the same format as individual notifications from NotifHandler, but only contain a `message` object containing the user.
    //Context is the same as in NotifHandler
    notifications.map(n => updateUser(n, context));
}
})
app.post('/batch', handler);
```

## OAuthHandler()

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

app.use("/auth", OAuthHandler({
  hostSecret,
  name: "Hubspot",
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


### manifest.json
```json
{
  "admin" : "/auth/",
}
```
### Params: 

##### hostSecret
The ship hosted secret (Not the one received from Hull. The one the hosted app itself defines. Will be used to encode tokens).

##### name
The name displayed to the User in the various screens.

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

# Middlewares

## Hull.Middlewares.hullClient()

```js
import Hull from "hull";

const hullClient = Hull.Middlewares.hullClient;

app.use(hullClient({ hostSecret:"supersecret", fetchShip: true, cacheShip: true }));

app.use((req, res) => { res.json({ message: "thanks" }); });

app.use(function(err, res, req, next){
  if(err) return res.status(err.status || 500).send({ message: err.message });
});
```

This middleware standardizes the instanciation of a Hull client from configuration passed as a Query string or as a token. It also optionally fetches the entire ship's configuration and caches it to save requests.

Here is what happens when your express app receives a query.

1. If a config object is found in `req.hull.config` it will be used to create an instance of the client.
2. If a token is present in `req.hull.token`, the middleware will try to use the `hostSecret` to decode it, store it in `req.hull.client`. When using `req.hull.token`, the decoded token should be a valid configuration object: `{id, organization, secret}`
3. If the query string contains `id`, `secret`, `organization`, they will be stored in `req.hull.config`
4. After this, if a valid configuration is in `req.hull.config`, a Hull client instance will be created and stored in `req.hull.client`

- When this is done, if `fetchShip=true`(default) then the Ship will be fetched and stored in `req.hull.ship`
- If `cacheShip=true` (default) the results will be cached.
- If the configuration or the secret is invalid, an error will be thrown that you can catch using express error handlers.

```js
app.use(function(req, res, next){
   //... your token retreiving method
   req.hull.token = myToken;
   next();
})
app.use(hullClient({ hostSecret:"supersecret", fetchShip: true, cacheShip: true }));
app.use(function(req, res){
  req.hull.config // {id, organization, secret}
  req.hull.client //instance of Hull client.
  req.hull.ship   //ship object - use to retreive current configuration. 
});

```


# Routes 

A simple set of route handlers to reduce boilerplate by a tiny bit.

## Hull.Routes.Readme

```js
import Hull from 'hull';
const { Routes } = Hull;
//Redirect to a properly formatted and designed version of the /README.MD file.
//Convenience method
app.get("/readme", Routes.Readme);
app.get("/", Routes.Readme);
//
```


## Hull.Routes.Manifest

```js
import Hull from 'hull';
const { Routes } = Hull;
//Serves the manifest.json from it's root to the right url; Convenience method
app.get("/manifest.json", Routes.Manifest(__dirname));
```
