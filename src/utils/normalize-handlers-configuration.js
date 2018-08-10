// @flow
import type {
  HullHandlersConfiguration,
  HullNormalizedHandlersConfiguration,
} from "../types";

const normalizeHandlersConfigurationEntry = require("./normalize-handlers-configuration-entry");

function normalizeHandlersConfiguration(
  configuration: HullHandlersConfiguration
): HullNormalizedHandlersConfiguration {
  if (configuration === undefined) {
    throw new Error(
      "normalizeHandlersConfiguration requires configuration object"
    );
  }
  return Object.keys(configuration).reduce(
    (normConf: HullNormalizedHandlersConfiguration, key: string) => {
      normConf[key] = normalizeHandlersConfigurationEntry(configuration[key]);
      return normConf;
    },
    {}
  );
}

module.exports = normalizeHandlersConfiguration;
