/**
 * @name enqueue
 * @public
 * @memberof Context
 * @param  {Object} queueAdapter [description]
 * @param  {Object} ctx          [description]
 * @param  {[type]} jobName      [description]
 * @param  {[type]} jobPayload   [description]
 * @param  {Object} options      [description]
 * @param  {number} options.ttl      Job producers can set an expiry value for the time their job can live in active state, so that if workers didn't reply in timely fashion, Kue will fail it with TTL exceeded error message preventing that job from being stuck in active state and spoiling concurrency.
 * @param  {number} options.delay    Delayed jobs may be scheduled to be queued for an arbitrary distance in time by invoking the .delay(ms) method, passing the number of milliseconds relative to now. Alternatively, you can pass a JavaScript Date object with a specific time in the future. This automatically flags the Job as "delayed".
 * @param  {number|string} options.priority
 * @return {Promise}              [description]
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
