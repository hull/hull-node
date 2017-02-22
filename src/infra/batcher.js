import _ from "lodash";
import Promise from "bluebird";

const HANDLERS = {};

export default class Batcher {

  static exit() {
    console.log("batcher.exit");
    if (!Batcher.exiting) {
      const exiting = Promise.all(_.map(HANDLERS, h => h.flush()));
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

    this.flushLater = _.throttle(this.flush.bind(this), this.options.throttle);
    return this;
  }

  setCallback(callback) {
    this.callback = callback;
    return this;
  }

  addMessage(message) {
    this.messages.push(message);
    this.logger.info("batcher.added", this.messages.length);
    const { maxSize } = this.options;
    if (this.messages.length >= maxSize) {
      this.flush();
    } else {
      this.flushLater();
    }
    return Promise.resolve("ok");
  }

  flush() {
    const messages = this.messages;
    this.logger.info("batcher.flush", messages.length);
    this.messages = [];
    return this.callback(messages)
      .then(() => {
        this.logger.info("batcher.flush.sucess");
      }, (err) => {
        console.error(err);
        this.logger.error("batcher.flush.error", err);
      });
  }
}
