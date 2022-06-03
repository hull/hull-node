const _ = require("lodash");
const Promise = require("bluebird");

const HANDLERS = {};

class Batcher {
  static exit() {
    console.log("batcher.exit");
    if (!Batcher.exiting) {
      const exiting = Promise.all(_.map(HANDLERS, (h) => h.flush()));
      Batcher.exiting = exiting;
      return exiting;
    }
    return Promise.resolve([]);
  }

  static getHandler(ns, args) {
    const name = ns + args.ctx.ship.id;
    return HANDLERS[name] = HANDLERS[name] || new Batcher(ns, args); // eslint-disable-line no-return-assign
  }

  constructor(ns, { ctx, options = {} }) {
    this.ns = ns;
    this.logger = ctx.client.logger;
    this.messages = [];
    this.options = options;

    this.flushLater = _.throttle(this.flush.bind(this), this.options.maxTime);
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
    return Promise.resolve(this.callback(messages))
      .catch((err) => {
        console.error(err);
        this.logger.debug("batcher.flush.error", err);
      });
  }
}

module.exports = Batcher;
