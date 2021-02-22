const Promise = require("bluebird");
const kue = require("kue");
// const ui = require("kue-ui");

/**
 * Kue Adapter for queue
 * @param {Object} options
 */
class KueAdapter {
  constructor(options) {
    this.options = options;
    this.queue = kue.createQueue(options);
    this.queue.watchStuckJobs();
    this.queue.on("error", (err) => {
      console.error("queue.adapter.error", err);
    });
    this.app = kue.app;

    ["inactiveCount", "activeCount", "completeCount", "failedCount", "delayedCount"].forEach((name) => {
      this[name] = Promise.promisify(this.queue[name]).bind(this.queue);
    });
  }

  /**
   * @param {string} jobName queue name
   * @param {Object} jobPayload
   * @return {Promise}
   */
  create(jobName, jobPayload = {}, { ttl = 0, delay = null, priority = null } = {}) {
    return Promise.fromCallback((callback) => {
      const job = this.queue.create(jobName, jobPayload)
        .attempts(3)
        .removeOnComplete(true);

      if (ttl) {
        job.ttl(ttl);
      }

      if (delay) {
        job.delay(delay);
      }

      if (priority) {
        job.priority(priority);
      }

      return job.save((err) => {
        callback(err, job.id);
      });
    });
  }

  /**
   * @param {string} jobName
   * @param {Function} jobCallback
   * @return {Object} this
   */
  process(jobName, jobCallback) {
    this.queue.process(jobName, (job, done) => {
      jobCallback(job)
        .then((res) => {
          done(null, res);
        }, (err) => {
          done(err);
        })
        .catch((err) => {
          done(err);
        });
    });
    return this;
  }

  exit() {
    return Promise.fromCallback((callback) => {
      this.queue.shutdown(5000, callback);
    });
  }

  // eslint-disable-next-line class-methods-use-this
  setupUiRouter(router) {
    return router;
    // ui.setup({
    //   apiURL: "/kue/_api", // IMPORTANT: specify the api url
    //   baseURL: "/kue", // IMPORTANT: specify the base url
    //   updateInterval: 5000 // Optional: Fetches new data every 5000 ms
    // });

    // router.use("/_api", this.app);
    // router.use("/", ui.app);
    // return router;
  }

  clean() {} // eslint-disable-line class-methods-use-this
}

module.exports = KueAdapter;
