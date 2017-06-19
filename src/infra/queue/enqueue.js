export default function enqueue(queueAdapter, ctx, jobName, jobPayload, options = {}) {
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
}
