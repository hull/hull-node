/**
 * @name enqueue
 * @public
 * @memberof Context
 * @param  {Object}  queueAdapter adapter to run - when using this function in Context this param is bound
 * @param  {Context} ctx          Hull Context Object - when using this function in Context this param is bound
 * @param  {string}  jobName      name of specific job to execute
 * @param  {Object}  jobPayload   the payload of the job
 * @param  {Object}        [options={}]
 * @param  {number}        [options.ttl]       job producers can set an expiry value for the time their job can live in active state, so that if workers didn't reply in timely fashion, Kue will fail it with TTL exceeded error message preventing that job from being stuck in active state and spoiling concurrency.
 * @param  {number}        [options.delay]     delayed jobs may be scheduled to be queued for an arbitrary distance in time by invoking the .delay(ms) method, passing the number of milliseconds relative to now. Alternatively, you can pass a JavaScript Date object with a specific time in the future. This automatically flags the Job as "delayed".
 * @param  {string}        [options.queueName] when you start worker with a different queue name, you can explicitly set it here to queue specific jobs to that queue
 * @param  {number|string} [options.priority]  you can use this param to specify priority of job
 * @return {Promise} which is resolved when job is successfully enqueued
 * @example
 * // app is Hull.Connector wrapped expressjs app
 * app.get((req, res) => {
 *   req.hull.enqueue("jobName", { payload: "to-work" })
 *     .then(() => {
 *       res.end("ok");
 *     });
 * });
 */
module.exports = function enqueue(queueAdapter, ctx, jobName, jobPayload, options = {}) {
  const { id, secret, organization } = ctx.client.configuration();
  const context = {
    hostname: ctx.hostname,
    query: {
      ship: id,
      secret,
      organization
    }
  };
  const queueName = options.queueName || "queueApp";

  return queueAdapter.create(queueName, {
    name: jobName,
    payload: jobPayload,
    context
  }, options);
};

