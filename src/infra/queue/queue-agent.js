import enqueue from "./enqueue";
import KueAdapter from "./adapter/kue";
import MemoryAdapter from "./adapter/memory";

export default class QueueAgent {

  constructor(adapterName, options) {
    if (!adapterName) {
      this.adapter = new MemoryAdapter();
    } else {
      this.adapter = new KueAdapter(options);
    }

    this.contextMiddleware = this.contextMiddleware.bind(this);
  }

  contextMiddleware() { // eslint-disable-line class-methods-use-this
    return function middleware(req, res, next) {
      req.hull = req.hull || {};
      req.hull.enqueue = req.hull.enqueue || enqueue.bind(null, this.adapter, req.hull);
      return next();
    };
  }

  exit() {
    return this.adapter.exit();
  }
}
