# 0.13.16
* Explicitly handle too large kraken notification payloads

# 0.13.15
* Bump hull-client version to 1.2.2
* Adds support for Account anonymous_id claim

# 0.13.14
* Fix flow type for THullEvent

# 0.13.13
* set unsupportedFlowControl default size to 10

# 0.13.12
* render docs without a TOC so the Website can display them properly.

# 0.13.11
* this release brings bigger changes to error handling:
  - it cleans up a little middleware stack including smart-notifier errors
  - it introduces two types of errors - `unhandled error` which is handled the same as till now, and `transient error` which won't be pushed to sentry, but only instrumented in datadog
  - it deprecates dedicated smartNotifierErrorMiddleware
  - smartNotifierHandler in case of error behaves like notifHandler and pass the error down the middleware stack
* added `timeout` option to `Hull.Connector` constructor to control the timeout value
* upgrades `raven` library
* add support for batch handlers for accounts
* adds `users_segments` and `accounts_segments` to Context Object
* **deprecation** Renamed `userHandlerOptions` to `options` in notifyHandler
* flow types fixes

# 0.13.10
* from now we test each commit on multiple nodejs versions
* in case of smart-notifier notification if requestId is not passed as an http header we fallback to notification_id from body
* adds more data to flow types
* adds ENV VAR flagged optional logging of metrics

# 0.13.9
* upgrades hull-client to v1.1.5 which have better error handling (retrying all 5xx errors not only 503)
* improved superagent instrumentation plugin metrics
* moved added newrelic and expressjs to peerDependencies to ensure good versions

# 0.13.8
* hotfixes CSVstream library which fails on Node v8

# 0.13.7
* remove `import/export` and `...spread` to make the code runnable on node v6
* remove babeljs es transpilation and replace it with `transform-flow-comments` plugin to have the flow annotations be included in resulting code in comments
* adds `superagentUrlTemplatePlugin` and `superagentInstrumentationPlugin` plugins for superagent client
* changed concurrency on `handleExtract` to 1

# 0.13.6
* Add requestId in client middleware to decorate logs with the incoming requestId

# 0.13.5
* added set of flow types which can be imported from "hull/lib/types"
* reduced logging from Batcher utility

# 0.13.4
* adjust `unsupportedChannelFlowControl` size param

# 0.13.3
* adjust handling unsupported channel in `smartNotifierHandler`

# 0.13.2
* pass original error information from `SmartNotifierValidator`

# 0.13.1
* adds error handler and segment filtering to `smartNotifierHandler`
* properly map account object from batch extract to notification format
* fetch 200 segments for segments middleware

# 0.13.0
* introduces `smartNotifierMiddleware` and `smartNotifierHandler` utils
* introduces `ctx.smartNotifierResponse` context object to build flow response
* added `skipSignatureValidation` `Hull.Connector` options to skip smartNotifier signature validation
* **breaking**: removed `serviceMiddleware` and `service` param on `Hull.Connector`, new way of applying service related objects to the Context Object is the `use` method on the Connector instance and initialize the service objects directly on the `req.hull.service` namespace
* restructurized tests folders and files

# 0.12.8
* properly map account object from batch extract to notification format
* fetch 200 segments for segments middleware

# 0.12.7
* makes `PromiseReuser` reuse the whole `cache.wrap`, not `client.get` only

# 0.12.6
* adds `PromiseReuser` class which allows us to handle in memory longer running promises and reuse them in case the same function is called multiple times with the same input

# 0.12.5
* upgrades hull-client to 1.1.3
* update documentation about initialization of `QueueAdapter`

# 0.12.4
* handle properly empty jobs in background worker

# 0.12.3
* upgrades underlying hull-client which fixes the way timeouted or errored rest API events are rejected

# 0.12.2
* adds option to get cache data via `req.hull.cache.get`

# 0.12.1
* adds options to `req.hull.cache.wrap` and `req.hull.cache.set` methods to set custom TTL
* adds `HULL_ENV` env variable to mark the environment passed to Sentry integration (default to production when not set)
* set default settings, including TTL for memory caching

# 0.12.0
* replaces low level api client with a separate library
* **breaking**: `client.utils.extract.handle` replaced by `ctx.helpers.handleExtract`
* **breaking**: `client.utils.extract.request` replaced by `ctx.helpers.requestExtract`
* **breaking**: removed `lib/utils/batchHandler` in favour of `lib/utils/notifHandler`
* **breaking**: removed `service` param on `Hull.Connector` in favor of custom middleware using `.use` method
* **breaking**: `QueueAgent` instance now accepts `QueueAdapter` instance instead of it's name. Load you adapter now like this:
  ```js
  import BullAdapter from "hull/lib/infra/queue/adapter/bull";

  const queueAdapter = new BullAdapter(options);

  const queue = new Queue(queueAdapter);
  ```
* don't exit on unhandled errors in by default, turn it on for workers
* handle unhandled rejection which was rejected to an undefined value
* add more context to the express app requests middleware stack
* adds logging to all oauth handler steps
* upgrade hull-client to v1.1.1 to add support for `scopes` claim in auth tokens

# 0.11.12
* when handling batch extract, `notifHandler` should respond as soon as we have started to download and process JSON file. Otherwise in case of big extract files in may lead to response timeout

# 0.11.9
* sqs adapter
* logging api timeouts and failures
* filter out logged claims for users and accounts so one can pass `hull.asUser(user)`
* add `client.as` alias and deprecation notice
* add error handling for oAuth client

# 0.11.8
* adds identification claims mapping for logger. Since now we can use: `client.asUser({ id, email }).logger("incoming.user.success");`

# 0.11.7
* adds `firehoseUrl` option to the Hull API client
* background firehose batcher respects `firehoseUrl` param, if not set defaults to `${protocol}://firehose.${domain}`
* adds `Hull-Organization` header to firehose calls
* make `notifHandler` working with handlers returning promise rejected to undefined value
* change notifications JSON bodyParser size limit to 256kb (same as SNS message limit)

# 0.11.6
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
