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
user.track('new support ticket', {
  messages: 3,
  priority:'high'  
}, {
  source: 'zendesk',
  ip: null, //don't store ip - it's a server call
  referer: null, //don't store referer - it's a server call
  created_at: '2013-02-08 09:30:26.123+07:00' //ISO 8601. moment.js does it very well 
});
```

Stores a new event, which you can namespace using the `source` property in the `context` parameter

## user.trait(properties, context)

```js
user.traits({
  opened_tickets: 12 
}, { source: 'zendesk' }); 
// 'source' is optional. Will store the traits grouped under the source name.
```

Stores Properties on the user.

# Class Methods

### Logging Methods: Hull.log(), Hull.debug(), Hull.metric()

```js
Hull.onLog(function(message="", data={}, context={}){
  //context can contain custom data.
  //When used from hull.utils.log, context will contain current client configuration
  // context = { id, organization, sudo, prefix, domain, protocol, userId }
});
Hull.log("message", { object });
hull.utils.log("message", { object });

//Debug works the same way but only logs if process.env.DEBUG===true
Hull.onDebug(function(message="", data={}, context={}){});
Hull.log("message", { object });
hull.utils.log("message", { object });

//Metric lets you increment a counter for metrics of your choosing
Hull.onMetric(function(metric="", value=1, context={}){});
Hull.metric('request', 1);
hull.utils.metric('request', 1);
```

By default, those 3 methods dump to `console` but they let you easily instument your code with more advanced loggers.

They come in both flavors, `Hull.xxx` and `hull.utils.xxx` - The first one is a generic logger, the second one injects the current instance of `Hull` so you can retreive ship name, id and organization for more precision.

## NotifHandler()

NotifHandler is a packaged solution to receive User and Segment Notifications from Hull. It's built to be used as an express route. Hull will receive notificaitons if your ship's `manifest.json` exposes a `subscriptions` key:

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
  onSubscribe() {} // called when a new subscription is installed
  onError() {} // called when an error is raised
  handlers: {
    'event': function() {
      console.log('Event Handler here', notif, context);
      // notif: { 
      //    message: { 
      //      user: { id: '123', ... }, 
      //      segments: [ { } ],
      //      event: {}
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
