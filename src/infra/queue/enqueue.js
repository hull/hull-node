export default function enqueue(queueAdapter, ctx, jobName, jobPayload, options = {}) {
  const context = {
    hostname: ctx.hostname,
    query: ctx.client.configuration()
  };

  return queueAdapter.create("queueApp", {
    name: jobName,
    payload: jobPayload,
    context
  }, options);
}
