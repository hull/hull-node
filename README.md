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

For convenience, we add `wrapped=true` to all collection requests.
This will give you an object in the form :
```json
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

## API

* `hull.configuration()` : Returns the global configuration
* `hull.userToken(userHash, claims)` : Creates a signed id for
the user passed in hash. It allows to connect your own users to
[hull.io](http://hull.io) services. userHash needs an `email` field
* `hull.currentUserId(userId, userSig)` : Checks the
validity of the signature relatively to a user id
* `hull.currentUserMiddleware()`: Generates a middleware
to add to your Connect/Express apps. It will check if a user is onnected.
* `hull.webhookMiddleware()`: Generates a middleware to answer to webhooks

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
