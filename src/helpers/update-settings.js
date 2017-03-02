/**
 * Updates `private_settings`, touching only provided settings.
 * Also clears the `shipCache`.
 * `hullClient.put` will emit `ship:update` notify event.
 * @param {Object} ctx The Context Object
 * @param  {Object} newSettings settings to update
 * @return {Promise}
 */
export default function updateSettings(ctx, newSettings) {
  const { client, cache } = ctx;
  return client.settings.update(newSettings)
    .then((ship) => {
      ctx.ship = ship;
      if (!cache) {
        return ship;
      }
      return cache.del(ship.id)
        .then(() => ship);
    });
}
