import Promise from "bluebird";


export default class MemoryAdapter {

  /**
   * @param {Object} queue Kue instance
   */
  constructor() {
    this.queue = [];
    ["inactiveCount", "activeCount", "completeCount", "failedCount", "delayedCount"].forEach((name) => {
      this[name] = () => Promise.resolve(0);
    });
  }

  /**
   * @param {String} jobName queue name
   * @param {Object} jobPayload
   * @return {Promise}
   */
  create(jobName, jobPayload = {}, { ttl = 0, delay = null, priority = null } = {}) {
    this.queue.push({
      jobName,
      jobPayload
    });
  }

  /**
   * @param {String} jobName
   * @param {Function -> Promise} jobCallback
   * @return {Object} this
   */
  process(jobName, jobCallback) {
    return this;
  }

  exit() {
    return Promise.resolve();
  }
}
