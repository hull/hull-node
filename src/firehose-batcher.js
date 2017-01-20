import _ from "lodash";
import restAPI from "./rest-api";
import Configuration from "./configuration";

const noop = function() {};
const BATCHERS = {};


global.setImmediate = global.setImmediate || process.nextTick.bind(process);

/**
 * Get an error from a `res`.
 *
 * @param {Object} res
 * @return {String}
 */

function error(res){
  if (!res.error) return;
  var body = res.body;
  var msg = body.error && body.error.message
    || res.status + ' ' + res.text;
  return new Error(msg);
}

function defaultHandler(params, batcher) {
  return restAPI(batcher.config, 'firehose', 'post', params);
}

class FirehoseBatcher {

  static getInstance(config, handler) {
    const { id, secret, organization, accessToken } = config;
    const key = [organization, id, secret].join("/")
    const batcher = BATCHERS[key] = BATCHERS[key] || new FirehoseBatcher(config, handler);
    return (message, fn) => {
      message.headers = message.headers || {};
      if (accessToken) {
        message.headers['Hull-Access-Token'] = accessToken;
      }
      return batcher.push(message, fn);
    }
  }

  constructor(config, handler) {
    this.handler = handler || defaultHandler;
    this.flushAt = Math.max(config.flushAt, 1) || 50;
    this.flushAfter = config.flushAfter || 1000;
    this.config = new Configuration(_.omit(config, "userId", "accessToken", "sudo"));
    this.queue = [];
  }

  push(payload) {
    return new Promise((resolve, reject) => {
      const message = { ...payload, timestamp: new Date() };
      const callback = (err, res) => {
        return err ? reject(err) : resolve(res);
      }

      this.queue.push({ message, callback });

      if (FirehoseBatcher.exiting === true) return this.flush();

      if (this.queue.length >= this.flushAt) this.flush();
      if (this.timer) clearTimeout(this.timer);
      if (this.flushAfter) this.timer = setTimeout(this.flush.bind(this), this.flushAfter);
    });
  }

  flush(fn){
    fn = fn || noop;
    if (!this.queue.length) return setImmediate(fn);

    const items = this.queue.splice(0, this.flushAt);
    const fns = items.map((i) => i.callback);
    const batch = items.map((i) => i.message);

    const params = {
      batch,
      timestamp: new Date(),
      sentAt: new Date()
    };

    return this.handler(params, this).then(
      ok => fns.forEach((fn) => fn(null, ok)),
      err => fns.forEach((fn) => fn(err, null))
    );

  }

}



function handleBeforeExit() {
  FirehoseBatcher.exiting = true;
  _.map(BATCHERS, b => b.flush());
}

process.on('beforeExit', handleBeforeExit);


module.exports = FirehoseBatcher;
