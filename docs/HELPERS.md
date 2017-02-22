# Hull API superset
Helpers is a set of functions being attached by `Hull.Middleware` to the `req.hull.client`
with the current context being applied as a first argument.
The functions could be also used one by one.

```js
import { requestExtract } from "hull/lib/helpers";

app.post("/request", (req, res) => {
  requestExtract(req.hull, { fields });
  // or:
  req.hull.client.requestExtract({ fields });
});
```

### requestExtract({ segment = null, format = "json", path = "batch", fields = [] })
Sends a request to Hull platform to trigger a extract of users.

### handleExtract({ body, chunkSize, handler })
Handles the incoming extract notification, downloads the extract payload and process it in a stream

### getSettings()
A shortcut to get to data from `req.hull.ship.private_settings`.

### updateSettings({ newSettings })
Allows to update selected settings of the ship `private_settings` object. New settings will be merged with existing ones.

### getAvailableProperties()
Returns information about all attributes available in the current organization

### filterUserSegments({ user })
Returns `true/false` based on if the user belongs to any of the segments selected in the settings segment filter. If there are no segments defined it will return `false` for all users.

### setUserSegments({ add_segment_ids = [], remove_segment_ids = [] }, user)
