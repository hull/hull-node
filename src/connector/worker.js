// @flow
const Supply = require("supply");
const Promise = require("bluebird");
const _ = require("lodash");

/**
 * Background worker using QueueAdapter.
 */
class Worker {
  queueAdapter: Object;

  instrumentation: Object;

  res: Object;

  supply: Supply;

  jobs: Object;

  constructor({ queue, instrumentation }: Object) {
    if (!queue) {
      throw new Error(
        "Worker initialized without all required dependencies: queue"
      );
    }
    this.queueAdapter = queue.adapter;
    this.instrumentation = instrumentation;

    this.supply = new Supply();

    // this.use(queue.contextMiddleware());
    // this.use(cache.contextMiddleware());

    // this.use(instrumentation.contextMiddleware());
    // instrument jobs between 1 and 5 minutes
    setInterval(this.metricJobs.bind(this), _.random(60000, 300000));

    setInterval(
      this.queueAdapter.clean.bind(this.queueAdapter),
      _.random(60000, 300000)
    );
  }

  metricJobs() {
    return Promise.all([
      this.queueAdapter.inactiveCount(),
      this.queueAdapter.failedCount(),
    ]).spread((inactiveCount, failedCount) => {
      this.instrumentation.metricVal("ship.queue.waiting", inactiveCount);
      this.instrumentation.metricVal("ship.queue.failed", failedCount);
    });
  }

  use(middleware: Function) {
    this.supply.use(middleware);
    return this;
  }

  setJobs(jobs: Object) {
    this.jobs = jobs;
  }

  process(queueName: string = "queueApp") {
    this.queueAdapter.process(queueName, job => {
      return this.dispatch(job);
    });
    return this;
  }

  dispatch(job: Object) {
    if (_.isEmpty(job.data)) {
      return Promise.resolve();
    }

    const jobName = job.data.name;
    const req = _.cloneDeep(job.data.context);
    const jobData = _.cloneDeep(job.data.payload);
    const res = {};

    const startTime = process.hrtime();
    return Promise.fromCallback(callback => {
      this.instrumentation.startTransaction(jobName, () => {
        this.runMiddleware(req, res)
          .then(() => {
            if (!this.jobs[jobName]) {
              const err = new Error(`Job not found: ${jobName}`);
              req.hull.client.logger.error(err.message);
              return Promise.reject(err);
            }
            req.hull.client.logger.debug("dispatch", {
              id: job.id,
              name: jobName,
            });
            req.hull.metric.increment(`ship.job.${jobName}.start`);
            return this.jobs[jobName].call(job, req.hull, jobData);
          })
          .then(jobRes => {
            callback(null, jobRes);
          })
          .catch(err => {
            req.hull.metric.increment(`ship.job.${jobName}.error`);
            this.instrumentation.catchError(
              err,
              {
                job_id: job.id,
                job_payload: jobData,
              },
              {
                job_name: job.data.name,
                organization: _.get(job.data.context, "query.organization"),
                ship: _.get(job.data.context, "query.ship"),
              }
            );
            callback(err);
          })
          .finally(() => {
            this.instrumentation.endTransaction();
            const duration = process.hrtime(startTime);
            const ms = duration[0] * 1000 + duration[1] / 1000000;
            req.hull.metric.value(`ship.job.${jobName}.duration`, ms);
          });
      });
    });
  }

  runMiddleware(req: Object, res: Object) {
    return Promise.fromCallback(callback => {
      this.supply.each(req, res, callback);
    });
  }
}

module.exports = Worker;
