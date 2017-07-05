# 0.11.7
* adds `firehoseUrl` option to the Hull API client
* background firehose batcher respects `firehoseUrl` param, if not set defaults to `${protocol}://firehose.${domain}`
* adds `Hull-Organization` header to firehose calls
* make `notifHandler` working with handlers returning promise rejected to undefined value
* change notifications JSON bodyParser size limit to 256kb (same as SNS message limit)

# 0.11.6
* adds `firehoseUrl` option to the Hull API client
* background firehose batcher respects `firehoseUrl` param, if not set defaults to `${protocol}://firehose.${domain}`
* adds `Hull-Organization` header
* make the `bull` adapter try 3 times before failing a job and cleaning completed jobs
* make sure we don't return any `undefined` in `segments` param while parsing batch request

# 0.11.5
* adds `bull` queue adapter using [OptimalBits/bull](https://github.com/OptimalBits/bull) library
* minor changes to the `queueUiRouter` to allow working with different adapters
* adds `ip` and `time` context param to traits call

# 0.11.4
* adds `queueName` as first argument to the `connector.startWorker` method
* adds `queueName` as option to the `ctx.enqueue` method

# 0.11.3
* add `timeout` and `retry` to client api calls options; when defined thogether timeout specifies number of miliseconds after which the connection would be timeouted and retry specifies number of miliseconds when the retry will be done after the timeout
* by default `client.get` method retries twice calls when error 503 is returned
* fetching connector settings and segments are instrumented by above settings to timeout after 5000 miliseconds and retried after 1000 ms
* fix dogapi calls to create events

# 0.11.2
* normalize the connector name in logs context
* make the `batchHandler` respond as soon as it starts to download the extract payload

# 0.11.1
* `ShipCache` properly returns a Promise for `del` method also for node-cache-manager stores which don't support Promise
* adds `queue` param to `queueUiRouter` to match naming of `Connector` - `queueAgent` is deprecated and will be removed in `0.12.0`
* fix the way Hull.Connector tried to load `manifest.json` file

# 0.11.0
* includes changes from all `0.11.0-beta` pre-releases
* makes sure that the json logging is always in one-line
* adds `helpersMiddleware` to the worker middleware stack
* updates outdated dependencies
* adds initial flow support
* adds logging to nofifHandler
* adds `segmentFilterSetting` setting to enable filtering - by default the filtering is not enabled
* `notifHandler` and `batchHandler` pass all notifications to handler, but adds `matchesFilter` flag (true/false)

# 0.11.0-beta.4
* fix `helpers.updateSettings`
* adds optional `connectorName` parameter to `Hull` client and `Hull.Connector` which if set will be added to logs context (which will end up as `connector_name` in the logs)
* if the name is not provided explicitly the `Hull.Connector` will try to read it from `manifest.json`
* by default set json format of the logger console output
* fix `del` method call - thanks @phillipalexander
* adds `additionalQuery` to `req.hull.helpers.requestExtract` and `req.hull.client.extract.request`
* adds third, optional parameter to `notifHandler` `user:update` handler to mark if we are processing batch or notifications - in case of batch it includes `query` and `body` params from request
* renamed `req.hull.helpers.filterUserSegments` to `req.hull.helpers.filterNotification`
* changed the filter to pass users who just left the filtered segment for last sync
* switched `batchHandler` to notification format instead of the simplified `user` object
* removed `setUserSegments`, instead default `segments` and `changes.segments.left` parameters should be used
* removed filter from internal `batchHandler` inside `notifHandler`

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
