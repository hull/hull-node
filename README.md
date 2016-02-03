# Node.js client for hull.io [ ![Codeship Status for hull/hull-node](https://www.codeship.io/projects/862851d0-b98b-0130-bbef-5e0af06e25c6/status?branch=master) ](https://www.codeship.io/projects/4360)


This provides utility functions to use hull.io APIs within Node.js apps.

## Usage

```js
import Hull from 'hull';

const hull = new Hull({
  platformId: 'YOUR_HULL_PLATFORM_ID',
  platformSecret: 'YOUR_HULL_PLATFORM_SECRET',
  orgUrl: 'YOUR_HULL_ORG_URL'
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

For convenience, we add `wrapped=true` to all requests that return a Collection as an Array. You will receive an object in the form :
```js
{
  data: [....],
  pagination:{
    next_url:'xxxx',
    last_url:'xxxx',
    'total': 1163,
    page: 1,
    pages: 39,
    per_page: 30
  }
}
```
If you want to un-nest the response and receive raw arrays, without pagination, add `wrapped:false` to your query

### Using the client as a specific user

```js
var user = hull.as('userId');
user.get('/me')
user.userToken()
//user is an instance of Hull, scoped to a specific user. it will act as if the user performed the action
```

## API

* `hull.configuration()` : Returns the global configuration
* `hull.as(userId)`: create a new Hull client acting as the user
* `hull.userToken({email:'xxx@example.com',name:'FooBar'}, claims)` : Creates a signed id for the user passed in hash. It allows to connect your own users to [hull.io](http://hull.io) services. userHash needs an `email` field. Read the docs about [Bring your own users](http://hull.io/docs/users/byou)
* `hull.currentUserId(userId, userSig)` : Checks the
validity of the signature relatively to a user id
* `hull.currentUserMiddleware()`: Generates a middleware
to add to your Connect/Express apps. It will check if a user is onnected.
* `hull.webhookMiddleware()`: Generates a middleware to answer to webhooks (deprecated, please use notifications instead)

```js
const app = express();

// a middleware with no mount path; gets executed for every request to the app
app.use(hull.currentUserMiddleware);
app.use(function(req,res,next){
  console.log(req.hull.userId) // Should exist if there is a user logged in;  
})

app.use(hull.webhookMiddleware);
//Responds to webhooks
app.use(function(req,res,next){
  console.log(req.body) // Webhook payload, decrypted.
})

```


### Receiving notifications from Hull

Your app can subscribe to events from Hull and receive notifications via http POST. 




```js
const app = express();
import NotifHandler from 'hull/notif-handler';

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
      //  ship: <Current ship instance if available>
      // }
    }
  }
})


app.post('/notify', handler);
```

