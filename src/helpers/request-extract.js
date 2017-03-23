/**
 * Start an extract job and be notified with the url when complete.
 * @param  {Object} options
 * @return {Promise}
 */
export default function requestExtract(ctx, { segment = null, path, fields = [] } = {}) {
  const { client, hostname } = ctx;
  return client.utils.extract.request({ hostname, segment, path, fields });
}
