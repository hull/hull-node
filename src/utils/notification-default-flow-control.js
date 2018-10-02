// @flow

import type { HullContextFull, HullNotificationFlowControl } from "../types";

const DEFAULT_FLOW_CONTROL = require("../lib/default_flow_controls.js");

type HullNotificationResult = "success" | "unsupported" | "error";

const _ = require("lodash");

const getSettingName = (channel, result, param) =>
  _.snakeCase(`flow_control_${channel}_${result}_${param}`);

/**
 * A utility which picks default notification flow control.
 * It picks from FLOW_CONTROL_USER_UPDATE_SUCCESS_SIZE
 * @param  {[type]} ctx:     HullContextFull     [description]
 * @param  {[type]} channel: string              [description]
 * @param  {[type]} result:  HullNotificationResult [description]
 * @return {[type]}          [description]
 */
function notificationDefaultFlowControl(
  ctx: HullContextFull,
  channel: string,
  result: HullNotificationResult
): HullNotificationFlowControl {

  function pickPrivateSettings(param: string): number {
    const settingName = getSettingName(channel, result, param);
    return parseInt(
      _.get(ctx, ["connector", "private_settings", settingName], 0),
      10
    );
  }
  function pickEnv(param: string): number {
    const envVarName = _.upperCase(getSettingName(channel, result, param));
    return parseInt(process.env[envVarName], 10);
  }

  const type = (result === "success" || result === "unsupported") ? "next" : "retry";

  return {
    type,
    size:
      pickPrivateSettings("size") ||
      pickEnv("size") ||
      DEFAULT_FLOW_CONTROL[result].size,
    in:
      pickPrivateSettings("in") ||
      pickEnv("in") ||
      DEFAULT_FLOW_CONTROL[result].in,
    in_time:
      pickPrivateSettings("in_time") ||
      pickEnv("in_time") ||
      DEFAULT_FLOW_CONTROL[result].in_time
  };
}

module.exports = notificationDefaultFlowControl;
