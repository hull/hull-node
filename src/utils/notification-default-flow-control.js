// @flow

import type { HullContext, HullNotificationFlowControl } from "../types";

type HullFlowControlType = "success" | "unsupported" | "error";

const _ = require("lodash");

function notificationDefaultFlowControl(ctx: HullContext, channel: string, type: HullFlowControlType): HullNotificationFlowControl {
  function pickPrivateSettings(param: string): number {
    const settingName = _.snakeCase(`default_${type}_flow_control_${channel}_${param}`);
    return parseInt(ctx.connector.private_settings[settingName], 10);
  }
  function pickEnv(param: string): number {
    const envVarName = _.upperCase(_.snakeCase(`default_${type}_flow_control_${channel}_${param}`));
    return parseInt(process.env[envVarName], 10);
  }
  return {
    type: "next",
    size: pickPrivateSettings("size") || pickEnv("size"),
    in: pickPrivateSettings("in") || pickEnv("in"),
    in_time: pickPrivateSettings("in_time") || pickEnv("in_time")
  };
}

module.exports = notificationDefaultFlowControl;
