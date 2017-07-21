import enqueue from "./enqueue";
import MemoryAdapter from "./adapter/memory";

export default class QueueAgent {

  constructor(adapter) {
    this.adapter = adapter;
    if (!this.adapter) {
      this.adapter = new MemoryAdapter();
    }

    this.contextMiddleware = this.contextMiddleware.bind(this);
  }

  contextMiddleware() { // eslint-disable-line class-methods-use-this
    return (req, res, next) => {
      req.hull = req.hull || {};
      req.hull.enqueue = req.hull.enqueue || enqueue.bind(null, this.adapter, req.hull);
      return next();
    };
  }

  exit() {
    return this.adapter.exit();
  }
}
