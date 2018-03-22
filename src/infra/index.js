/**
 * Production ready connectors need some infrastructure modules to support their operation, allow instrumentation, queueing and caching. The [Hull.Connector](#hullconnector) comes with default settings, but also allows to initiate them and set a custom configuration:
 *
 * @namespace Infra
 * @public
 * @example
 * const instrumentation = new Instrumentation();
 * const cache = new Cache();
 * const queue = new Queue();
 *
 * const connector = new Hull.Connector({ instrumentation, cache, queue });
 */
module.exports.Cache = require("./cache");
module.exports.Instrumentation = require("./instrumentation");
module.exports.Queue = require("./queue");
module.exports.Batcher = require("./batcher");
