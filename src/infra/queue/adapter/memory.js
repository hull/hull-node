import _ from "lodash";
import Promise from "bluebird";


export default class MemoryAdapter {

  /**
   * @param {Object} queue Kue instance
   */
  constructor() {
    this.queue = {};
    this.processors = {};
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
    if (delay) {
      setTimeout(this.enqueue.bind(this, jobName, jobPayload), delay);
      return Promise.resolve();
    }

    return this.enqueue(jobName, jobPayload);
  }

  enqueue(jobName, jobPayload) {
    this.queue[jobName] = this.queue[jobName] || [];
    this.queue[jobName].push({
      id: this.queue[jobName].length,
      data: {
        name: jobName,
        ...jobPayload
      }
    });
    return this.processQueues();
  }

  /**
   * @param {String} jobName
   * @param {Function -> Promise} jobCallback
   * @return {Object} this
   */
  process(jobName, jobCallback) {
    this.processors[jobName] = jobCallback;
    this.processQueues();
    return this;
  }

  processQueues() {
    return Promise.all(_.map(this.processors, (jobCallback, jobName) => {
      if (_.get(this.queue, jobName, []).length === 0) {
        return;
      }
      const job = this.queue[jobName].pop();
      return jobCallback(job);
    }))
    // .then(() => {
    //   this.processQueues();
    // }, () => {
    //   this.processQueues();
    // });
  }

  exit() {
    return Promise.resolve();
  }
}
