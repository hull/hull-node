# Node.js client for hull.io [ ![Codeship Status for hull/hull-node](https://www.codeship.io/projects/862851d0-b98b-0130-bbef-5e0af06e25c6/status?branch=master) ](https://www.codeship.io/projects/4360)


This provides utility functions to use hull.io APIs within Node.js apps.

## Usage

```
var hull = require('hull')


hull.conf({
  appId: 'YOUR_HULL_APP_ID',
  orgUrl: 'YOUR_HULL_ORG_URL',
  appSecret: 'YOUR_HULL_APP_SECRET'
});

// Instanciates a client for the API
var client = hull.client();
```

## API

* `hull.conf(obj)` : Returns the global configuration or sets it if an object is given. It's mostly a helper to avoid the necessity of specifying the configuration everytime it is needed.
* `hull.utils.signUserData(userJson/*, appSecret*/)` : Creates a signed id for the user passed in parameter. It allows to connect your own users to [hull.io](http://hull.io) services.
* `hull.utils.checkSignedUserId(userId, userSig/*, appSecret*/)` : Checks the validity of the signature relatively to a user id
* `hull.middleware(/*appId, appSecret, deserializer*/)`: Generates a middleware to add to your Connect/Express apps. It will check if a user is onnected.
* `hull.client()`: Instanciates an HTTP client to [hull.io](http://hull.io) APIs.

### Using the HTTP client

Once you have instanciated a client, you can use one of the `get`, `post`, `put`or `delete` methods to perform actions of our APIs.
The first parameter is the route, the second is the set of parameters you want to send with the request, the third is a callback.


## Resources

We have built a demo that uses this library, check out [hull\_userbase](http://github.com/hull/hull_userbase).

Also check out the [API documentation](http://hull.io/docs/api) to learn what you can achieve with our APIs.

# LICENCE

MIT
