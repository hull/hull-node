# Hull API superset
The `agent` is a set of functions being attached by `Hull.Middleware` to the `req.hull.agent`
with the current context being applied as a first argument.
The functions could be also used one by one.

```js
import { requestExtract } from "hull/lib/agent";


app.post("/request", (req, res) => {
  requestExtract(req.hull, { fields });
  // or:

  req.hull.agent.requestExtract({ fields });
});
```

## requestExtract()
## handleExtract()

## getSettings()
## updateSettings()

## getAvailableProperties()

## filterUserSegments()
## setUserSegments()


