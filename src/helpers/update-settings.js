/**
 * Allows to update selected settings of the ship `private_settings` object. This is a wrapper over `hullClient.utils.settings.update()` call. On top of that it makes sure that the current context ship object is updated, and the ship cache is refreshed.
 * It will emit `ship:update` notify event.
 *
 * @public
 * @name updateSettings
 * @memberof Context.helpers
 * @param {Object} ctx The Context Object
 * @param  {Object} newSettings settings to update
 * @return {Promise}
 * @example
 * req.hull.helpers.updateSettings({ newSettings });
 */
module.exports = function updateSettings(ctx, newSettings) {
  const { client, cache } = ctx;
  return client.utils.settings.update(newSettings)
    .then((ship) => {
      ctx.ship = ship;
      if (!cache) {
        return ship;
      }
      return cache.del(ship.id)
        .then(() => ship);
    });
};
