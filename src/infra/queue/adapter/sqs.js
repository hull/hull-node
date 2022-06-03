const _ = require("lodash");
const Aws = require("aws-sdk");
const SqsConsumer = require("sqs-consumer");
const Promise = require("bluebird");

/**
 * SQS Adapter for queue
 */
class SQSAdapter {
  inactiveCount() { // eslint-disable-line class-methods-use-this
    console.warn("Queue adapter inactiveCount not implemented");
    return Promise.resolve(0);
  }

  failedCount() { // eslint-disable-line class-methods-use-this
    console.warn("Queue adapter failedCount not implemented");
    return Promise.resolve(0);
  }

  exit() { // eslint-disable-line class-methods-use-this
    return this.consumer && this.consumer.stop();
  }

  setupUiRouter(router) { // eslint-disable-line class-methods-use-this
    return router;
  }

  clean() { // eslint-disable-line class-methods-use-this
  }

  constructor(options) {
    this.options = options;
    Aws.config.update(_.pick(options, "accessKeyId", "secretAccessKey", "region"));
    this.sqs = new Aws.SQS({ apiVersion: "2012-11-05" });
    this.sendMessage = Promise.promisify(this.sqs.sendMessage.bind(this.sqs));
  }

  /**
   * @param {string} jobName queue name
   * @param {Object} jobPayload
   * @return {Promise}
   */
  create(jobName, jobPayload = {}, { attempts = 3, delay = 0, priority = 1 } = {}) {
    return this.sendMessage({
      MessageDeduplicationId: `${jobName}-${new Date().getTime()}`,
      MessageGroupId: `${jobName}-${new Date().getTime()}`,
      DelaySeconds: delay / 1000,
      MessageAttributes: {
        jobName: { DataType: "String", StringValue: jobName },
        attempts: { DataType: "Number", StringValue: attempts.toString() },
        priority: { DataType: "Number", StringValue: priority.toString() }
      },
      MessageBody: JSON.stringify(jobPayload),
      QueueUrl: this.options.queueUrl
    });
  }

  /**
   * @param {string} jobName
   * @param {Function} jobCallback
   * @return {Object} this
   */
  process(jobName, jobCallback) {
    const consumer = SqsConsumer.create({
      messageAttributeNames: [jobName],
      queueUrl: this.options.queueUrl,
      sqs: this.sqs,
      visibilityTimeout: 3600 * 4,
      terminateVisibilityTimeout: true,
      handleMessage: (message, done) => {
        try {
          const id = message.MessageId;
          const data = JSON.parse(message.Body);
          return jobCallback({ id, data })
            .then(() => done())
            .catch(done);
        } catch (err) {
          return done(err);
        }
      }
    });

    consumer.on("processing_error", (err) => {
      console.error("queue.adapter.processing_error", err);
    });

    consumer.on("error", (err) => {
      console.error("queue.adapter.error", err);
    });

    consumer.start();

    this.consumer = consumer;

    return this;
  }
}

module.exports = SQSAdapter;
