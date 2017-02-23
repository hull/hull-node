# Internal libraries
This is a set of internal utilities being used by the `Hull.App` and `Handlers`.
They should be used in case of special requirements or a need of greater customization.

## Hull.Middleware()
This middleware standardizes the instantiation of a Hull client from configuration passed as a Query string or as a token. It also optionally fetches the entire ship's configuration and caches it to save requests.

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
});

```


## serviceMiddleware
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
