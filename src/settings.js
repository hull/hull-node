/**
 * Updates `private_settings`, touching only provided settings.
 * Also clears the `shipCache`.
 * `hullClient.put` will emit `ship:update` notify event.
 * @param {Object} ctx The Context Object
 * @param  {Object} newSettings settings to update
 * @return {Promise}
 */
export function update(newSettings) { // eslint-disable-line import/prefer-default-export
  return this.get("app")
    .then((ship) => {
      const private_settings = { ...ship.private_settings, ...newSettings };
      ship.private_settings = private_settings;
      return this.put(ship.id, { private_settings });
    });
}
