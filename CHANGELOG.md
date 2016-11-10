# 0.10.4

* All to bypass requireCredentials on Middleware

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
