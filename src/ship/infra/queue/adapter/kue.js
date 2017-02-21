import Promise from "bluebird";
import kue from "kue";
/**
 * Kue Adapter for queue
 */
export default class KueAdapter {

  /**
   * @param {Object} queue Kue instance
   */
  constructor(options) {
    this.options = options;
    this.queue = kue.createQueue(options);
    this.queue.watchStuckJobs();
    this.app = kue.app;

    ["inactiveCount", "activeCount", "completeCount", "failedCount", "delayedCount"].forEach((name) => {
      this[name] = Promise.promisify(this.queue[name]).bind(this.queue);
    });
  }

  /**
   * @param {String} jobName queue name
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
   * @param {String} jobName
   * @param {Function -> Promise} jobCallback
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
}
