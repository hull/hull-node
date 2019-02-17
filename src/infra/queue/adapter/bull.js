const Queue = require("bull");
const debug = require("debug")("hull-node:bull");

/**
 * Bull Adapter for queue
 */
class BullAdapter {
  constructor(options) {
    this.options = options;
    this.queue = new Queue("main", options);
    this.queue.on("error", err => {
      debug("queue.adapter.error", err);
    });
    this.queue.on("cleaned", (job, type) => {
      debug("queue.adapter.clean", { count: job.length, type });
    });
  }

  inactiveCount() {
    return this.queue.getJobCounts().then(counts => counts.wait);
  }

  failedCount() {
    return this.queue.getJobCounts().then(counts => counts.failed);
  }

  /**
   * @param {string} jobName queue name
   * @param {Object} jobPayload
   * @return {Promise}
   */
  create(
    jobName,
    jobPayload = {},
    { ttl = 0, delay = null, priority = null } = {}
  ) {
    const options = {
      priority,
      delay,
      timeout: ttl,
      attempts: 3,
      removeOnComplete: true,
    };
    return this.queue.add(jobName, jobPayload, options);
  }

  /**
   * @param {string} jobName
   * @param {Function} jobCallback
   * @return {Object} this
   */
  process(jobName, jobCallback) {
    this.queue.process(jobName, job => {
      return jobCallback(job);
    });
    return this;
  }

  exit() {
    return this.queue.close();
  }

  setupUiRouter(router) {
    // eslint-disable-line class-methods-use-this
    // due to problems in arena configuration it's disabled right now
    // and removed from the package.json
    //
    // const arenaConfig = {
    //   queues: [{
    //     name: "main",
    //     port: this.queue.client.options.port,
    //     host: this.queue.client.options.host,
    //     hostId: "main",
    //     db: this.queue.client.options.db,
    //     password: this.queue.client.options.password,
    //     prefix: this.options.prefix
    //   }]
    // };
    // router.use('/', arena(arenaConfig));
    return router;
  }

  clean() {
    // failed in more than 15 days
    this.queue.clean(1296000000, "failed");
  }
}

module.exports = BullAdapter;
