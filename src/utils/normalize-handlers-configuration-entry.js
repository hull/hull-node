// @flow
import type { HullHandlersConfigurationEntry, HullNormalizedHandlersConfigurationEntry, HullHandlerCallback } from "../types";

function parseHandlersConfigurationEntry(configurationEntry: HullHandlersConfigurationEntry): HullNormalizedHandlersConfigurationEntry {
  let callback: HullHandlerCallback | void;
  let options = {};
  if (typeof configurationEntry === "function") {
    callback = configurationEntry;
  } else if (configurationEntry && typeof configurationEntry === "object" && typeof configurationEntry.callback === "function") {
    callback = configurationEntry.callback;
    options = typeof configurationEntry === "object" && typeof configurationEntry.options === "object"
      ? configurationEntry.options : {};
  }
  if (callback === undefined) {
    throw new Error("Callback is missing in handler configuration entry");
  }
  return {
    callback,
    options
  };
}

module.exports = parseHandlersConfigurationEntry;
