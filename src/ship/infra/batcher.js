import _ from "lodash";
import Promise from "bluebird";

const HANDLERS = {};

export default class Batcher {

  static exit() {
    console.log("groupHandler.exit");
    if (!Batcher.exiting) {
      const exiting = Promise.all(_.map(HANDLERS, h => h.flush()));
      Batcher.exiting = exiting;
      return exiting;
    }
    return Promise.resolve([]);
  }

  static getHandler(ns, args) {
    const name = ns + args.req.hull.ship.id;
    return HANDLERS[name] = HANDLERS[name] || new Batcher(ns, args); // eslint-disable-line no-return-assign
  }

  constructor(ns, { req, options = {} }) {
    this.ns = ns;
    this.logger = req.hull.client.logger;
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
    this.logger.info("groupHandler.added", this.messages.length);
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
    this.logger.info("groupHandler.flush", messages.length);
    this.messages = [];
    return this.callback(messages)
      .then(() => {
        this.logger.info("groupHandler.flush.sucess");
      }, (err) => {
        console.error(err);
        this.logger.error("groupHandler.flush.error", err);
      });
  }
}
