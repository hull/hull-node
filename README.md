# Node.js client for hull.io

This provides utility functions to use hull.io APIs within Node.js apps.

## Usage

```
var hull = require('hull')

var hullClient = hull({
  appId: 'YOUR_HULL_APP_ID',
  orgUrl: 'YOUR_HULL_ORG_URL',
  appSecret: 'YOUR_HULL_APP_SECRET'
});
```

## API

* `hullClient::getUserHash(user_data)` is used to create a hash that will be used during the HTTP requests so you can bind your own userbase
    to data from hull.io.

# LICENCE

MIT
