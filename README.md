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

## Hull.Middleware()

### Params

##### hostSecret
The ship hosted secret (Not the one received from Hull. The one the hosted app itself defines. Will be used to encode tokens).

##### clientConfig
Additional config which will be passed to the new instance of Hull Client

```js
import Hull from "hull";

app.use(Hull.Middleware({ hostSecret: "supersecret" }));

app.use((req, res) => { res.json({ message: "thanks" }); });

app.use(function(err, res, req, next){
  if(err) return res.status(err.status || 500).send({ message: err.message });
});
```

This middleware standardizes the instantiation of a Hull client from configuration passed as a Query string or as a token. It also optionally fetches the entire ship's configuration and caches it to save requests.

Here is what happens when your express app receives a query.

1. If a config object is found in `req.hull.config` it will be used to create an instance of the client.
2. If a token is present in `req.hull.token`, the middleware will try to use the `hostSecret` to decode it, store it in `req.hull.client`. When using `req.hull.token`, the decoded token should be a valid configuration object: `{id, organization, secret}`
3. If the query string contains `id`, `secret`, `organization`, they will be stored in `req.hull.config`
4. After this, if a valid configuration is in `req.hull.config`, a Hull client instance will be created and stored in `req.hull.client`

- When this is done, then the Ship will be fetched and stored in `req.hull.ship`
- If there is a `req.hull.cache` registered in the request context object, it will be used to cache the ship object
- If the configuration or the secret is invalid, an error will be thrown that you can catch using express error handlers.

```js
app.use(function(req, res, next){
   //... your token retreiving method
   req.hull.token = myToken;
   next();
})
app.use(Hull.Middleware({ hostSecret: "supersecret" }));
app.use(function(req, res){
  req.hull.config // {id, organization, secret}
  req.hull.client // instance of Hull client.
  req.hull.ship   // ship object - use to retreive current configuration.
  req.hull.agent  // a superset of Hull API to perform typical actions
});

```


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
//If you only have an anonymous ID, use the `anonymous_id` field
var user = hull.as({ anonymous_id: '123456789' });

//if you have a user id from your database, use the `external_id` field
var user = hull.as({ external_id: 'dkjf565wd654e' });

//if you retrieved a Hull Internal User Id:
//second argument is optional and specifies wether we get the user's right or admin rights.
var user = hull.as('5718b59b7a85ebf20e000169', false);

//user is an instance of Hull, scoped to a specific user.
//Default is false: "get user rights".
user.get('/me').then(function(me){
  console.log(me)
});
//It will act as if the user performed the action if the second parameter is falsy
```

One of the more frequent use case is to perform API calls with the identity of a given user. We provide several methods to do so.

You can use an internal Hull `id`, an Anonymous ID from that we call a `anonymous_id`, an ID from your database that we call `external_id`, or even the ID from a supported social service such as Instagram;

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
hull.as({anonymous_id:'anonymousId'}, sudo)
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

const user = hull.as({external_id: externalId, anonymous_id: anonymousId})
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


# Additional docs:

- [Ship](docs/SHIP.md)
