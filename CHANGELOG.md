# 0.11.0-beta.4
* fix `helpers.updateSettings`
* adds optional `connector_name` parameter to `Hull` client and `Hull.Connector` which if set will be added to logs context
* by default set json format of the logger console output

# 0.11.0-beta.3
* fix the `requestExtract` handler - allow passing `path` param
* fix the `.asUser()` and `.asAccount()` to return `traits` and `track`
* adds `.asUser().account()` method

# 0.11.0-beta.2
* Reorganize the utils/helpers
* Introduce hull.as() create option
* Upgrade raven API and add default exit handler
* Combine notifHandler and batchHandler
* Automatically filter out users using segment filter on user:update and NOT on batch actions
* Renames `hull().as()` method to `hull().asUser()`
* Adds initial support for accounts

# 0.11.0-beta.1

* Adds `/app` with `Hull.App`, `Server` and `Worker`
* Adds `/helpers` with functions being added to the `req.hull.client` after being initiated by the `Hull.Middleware`
* Adds `/infra` with `Instrumentation`, `Queue`, `Cache` and `Batcher` services
* Adds `/utils` with `handlers`, `middlewares` and `routers` used as a building blocks of the `HullApp` and to be used by the ship/connector directly
* BREAKING - changed the callback signature in `NotifHandler`

# 0.10.8

* Properly handle Passport strategies that don't accept a 6-argument method.

# 0.10.7

* Add optional `tokenInUrl` argument in `OAuthHandler` allowing to force static urls
* Only support an object as second argument in `hull.logger.*` and `Hull.logger.*` - for better logging

# 0.10.6

* Allow passing `clientConfig` to Middleware and NotifHandler
* Keeps the logging context consist of organization and ship id

# 0.10.5

* Move signing cache key to ship-cache module

# 0.10.4

* Allow to bypass requireCredentials on Middleware

# 0.10.3

* Add processed count in batch handler context

# 0.10.2

* Sign ship cache key with secret

# 0.10.1

* Ship caching

# 0.10.0

* Hull.as uses lookup tokens by default

# 0.9.7

* Add support for `sync:true` option on `Hull.traits`

# 0.9.6

* Automatically batch calls to firehose endpoint

# 0.9.5

* Ensure `Hull.utils.groupTraits` returns an Object everytime, even if index values such as `traits_0` are set.
* Add Tests

# 0.9.4

* isSetup method in oAuth handler accepts parameters in resolve and reject to pass to the view

# 0.9.3

* Fix unsupported traits with special characters

# 0.9.0

### Added OAuth Handler

### Revamped Logging.
- Removed `Hull.log`, `Hull.debug`, `Hull.onDebug`, `Hull.onMetric`, `Hull.onLog`, `hull.utils.debug`, `hull.utils.log`, `hull.utils.metric`
- Added [Winston](https://github.com/winstonjs/winston) Logger that can accept new transports easily.
