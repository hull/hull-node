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

  return queueAdapter.create("queueApp", {
    name: jobName,
    payload: jobPayload,
    context
  }, options);
}
