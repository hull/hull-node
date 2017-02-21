import queueCreate from "./create";
import KueAdapter from "./adapter/kue";

export default class QueueAgent {

  constructor(adapterName, options) {
    this.adapter = new KueAdapter(options);
    this.middleware = this.middleware.bind(this);
  }

  middleware(req, res, next) {
    req.hull = req.hull || {};
    req.hull.queue = req.hull.queue || queueCreate.bind(null, this.adapter, req.hull);
    return next();
  }

  exit() {
    return this.adapter.exit();
  }
}
