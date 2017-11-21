module.exports = function mockSettings(settings) {
  return {
    hull: {
      ship: {
        private_settings: settings
      }
    }
  };
}
