const _ = require("lodash");
const Promise = require("bluebird");
const debug = require("debug")("hull-connector:batcher");

const HANDLERS = {};

class Batcher {
  static exit() {
    debug("batcher.exit");
    if (!Batcher.exiting) {
      const exiting = Promise.all(_.map(HANDLERS, h => h.flush()));
      Batcher.exiting = exiting;
      return exiting;
    }
    return Promise.resolve([]);
  }

  static getHandler(ns, args) {
    const name = ns + args.ctx.ship.id;
    return (HANDLERS[name] = HANDLERS[name] || new Batcher(ns, args)); // eslint-disable-line no-return-assign
  }

  constructor(ns, { ctx, options = {} }) {
    this.ns = ns;
    this.logger = ctx.client.logger;
    this.messages = [];
    this.options = options;

    this.flushLater = _.throttle(this.flush.bind(this), this.options.maxTime);
    return this;
  }

  setCallback(callback) {
    this.callback = callback;
    return this;
  }

  addMessage(message) {
    this.messages.push(message);
    const { maxSize } = this.options;
    if (this.messages.length >= maxSize) {
      this.flush();
    } else {
      this.flushLater();
    }
    return Promise.resolve("ok");
  }

  flush() {
    const { messages } = this;
    this.messages = [];
    return Promise.resolve(this.callback(messages)).catch(err => {
      console.error(err); //eslint-disable-line no-console
      this.logger.debug("batcher.flush.error", err);
    });
  }
}

module.exports = Batcher;
