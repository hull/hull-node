/**
 * Allows to update selected settings of the ship `private_settings` object. This is a wrapper over `hullClient.utils.settings.update()` call. On top of that it makes sure that the current context ship object is updated, and the ship cache is refreshed.
 * It will emit `ship:update` notify event.
 *
 * @public
 * @name updateSettings
 * @memberof Utils
 * @param {Object} ctx The Context Object
 * @param  {Object} newSettings settings to update
 * @return {Promise}
 * @example
 * req.hull.helpers.updateSettings({ newSettings });
 */
function settingsUpdate(ctx, newSettings) {
  const { client, cache } = ctx;
  return client.utils.settings.update(newSettings)
    .then((connector) => {
      ctx.connector = connector;
      if (!cache) {
        return connector;
      }
      return cache.del(connector.id)
        .then(() => connector);
    });
}

module.exports = settingsUpdate;
