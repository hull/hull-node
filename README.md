# Node.js client for hull.io [ ![Codeship Status for hull/hull-node](https://www.codeship.io/projects/862851d0-b98b-0130-bbef-5e0af06e25c6/status?branch=master) ](https://www.codeship.io/projects/4360)


This provides utility functions to use hull.io APIs within Node.js apps.

## Usage

```js
import Hull from 'hull';

const hull = new Hull({
  id: 'HULL_ID',
  secret: 'HULL_SECRET',
  organization: 'HULL_ORGANIZATION_DOMAIN'
});
```

### Using the HTTP client

Once you have instanciated a client, you can use one of the `get`, `post`,
`put`or `delete` methods to perform actions of our APIs.
The first parameter is the route, the second is the set of parameters you want
to send with the request, the third is a callback.

```js
//hull.api.get works too.
hull.get(path /*, params*/).then(function(data){
  console.log(response);
},function(err, response){
  console.log(err);
});
```

### Using the client as a specific user

```js
//user id from your database, lazily creates a user.
var user = hull.as({ external_id: 'dkjf565wd654e' });
//or if you retrieved a Hull Internal User Id:
var user = hull.as('5718b59b7a85ebf20e000169', false);
//second argument is optional and specifies wether we get the user's right or admin rights.
//Default is false: "get user rights". 
user.get('/me').then(function(me){
  console.log(me)
});
user.userToken();
//user is an instance of Hull, scoped to a specific user.
//It will act as if the user performed the action if the second parameter is falsy
```

## API

* `hull.configuration()` : Returns the global configuration
* `hull.as(userId, sudo)`: create a new Hull client acting as the user
* `hull.as({external_id:'externalId'}, sudo)`: Lazily find or create a new user and return it's hull client.
* `hull.userToken({email:'xxx@example.com',name:'FooBar'}, claims)` : used for [Bring your own users](http://hull.io/docs/users/byou) - Creates a signed string for the user passed in hash. userHash needs an `email` field. [You can then pass this client-side to Hull.js](http://www.hull.io/docs/users/byou) to authenticate users client-side and cross-domain
* `hull.currentUserId(userId, userSig)` : Checks the validity of the signature relatively to a user id
* `hull.currentUserMiddleware()`: Reverse of Bring your own Users. When using Hull's Identity management, tells you who the current user is. Generates a middleware to add to your Connect/Express apps.

```js
const app = express();

// a middleware with no mount path; gets executed for every request to the app
app.use(hull.currentUserMiddleware);
app.use(function(req,res,next){
  console.log(req.hull.userId) // Should exist if there is a user logged in;  
})
```

### API calls as a user:

* `hull.as(userId, sudo).track(eventName, properties, context)` Stores a new event, which you can namespace using the `source` property in the `context` parameter
* `hull.as(userId, sudo).trait(properties)` Stores Properties on the user.

```js
const sudo = true;
const userId = '5718b59b7a85ebf20e000169';
const externalId = 'dkjf565wd654e';

user = hull.as({external_id: externalId}) //lazily creates a user;
//user.get('/me') promise will fetch this user's data.
//alternatively, if you have the Hull UserId handy,
//just do `hull.as(userId)`
user.track('new support ticket', {
  messages: 3,
  priority:'high'  
}, {
  source: 'zendesk',
  ip: null, //don't store ip - it's a server call
  referer: null, //don't store referer - it's a server call
  created_at: '2013-02-08 09:30:26.123+07:00' //ISO 8601. moment.js does it very well 
});

user.traits({
  opened_tickets: 12 
}, { source: 'zendesk' }); 
// 'source' is optional. Will store the traits grouped under the source name.
```


### Utils

#### groupTraits(user_report)

Returns a grouped version of the traits in the flat user report we return from the API.

The NotifHandler already does this by default.

Example user: 
```js
Hull.utils.groupTraits({
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

### Receiving notifications from Hull

Your app can subscribe to events from Hull and receive notifications via http POST. 

```js
const app = express();
import { NotifHandler } from 'hull';

const handler = NotifHandler({
  onSubscribe() {} // called when a new subscription is installed
  onError() {} // called when an error is raised
  events: {
    'user_report:update' : function(notif, context) {
      console.warn('Event Handler here', notif, context);
      // notif: { 
      //    message: { id: '123', ... }, 
      //    subject: 'user_report:update', 
      //    timestamp: "2016-02-03T17:01:57.393Z' }
      // }
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

