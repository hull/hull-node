import enqueue from "./enqueue";
import KueAdapter from "./adapter/kue";
import BullAdapter from "./adapter/bull";
import SqsAdapter from "./adapter/sqs";
import MemoryAdapter from "./adapter/memory";

export default class QueueAgent {

  constructor(adapterName, options) {
    switch (adapterName) {
      case "bull":
        this.adapter = new BullAdapter(options);
        break;
      case "kue":
        this.adapter = new KueAdapter(options);
        break;
      case "sqs":
        this.adapter = new SqsAdapter(options);
        break;
      case "memory":
      default:
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
