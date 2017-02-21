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
  return client.get(this.ship.id)
    .then((ship) => {
      const private_settings = { ...ship.private_settings, ...newSettings };
      ship.private_settings = private_settings;
      return client.put(ship.id, { private_settings });
    })
    .then((ship) => {
      ctx.ship = ship;
      if (!cache) {
        return ship;
      }
      return cache.del(ship.id)
        .then(() => {
          return ship;
        });
    });
}
