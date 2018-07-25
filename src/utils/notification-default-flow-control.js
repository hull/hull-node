// @flow

import type { HullContextFull, HullNotificationFlowControl } from "../types";

type HullNotificationResult = "success" | "unsupported" | "error";

const _ = require("lodash");

/**
 * A utility which picks default notification flow control.
 * It picks from FLOW_CONTROL_USER_UPDATE_SUCCESS_SIZE
 * @param  {[type]} ctx:     HullContextFull     [description]
 * @param  {[type]} channel: string              [description]
 * @param  {[type]} result:  HullNotificationResult [description]
 * @return {[type]}          [description]
 */
function notificationDefaultFlowControl(ctx: HullContextFull, channel: string, result: HullNotificationResult): HullNotificationFlowControl {
  const defaultValues = {
    success: {
      size: 10,
      in: 5,
      in_time: 10
    },
    error: {
      size: 10,
      in: 5,
      in_time: 10
    },
    unsupported: {
      size: 10,
      in: 5,
      in_time: 10
    }
  };

  function pickPrivateSettings(param: string): number {
    const settingName = _.snakeCase(`flow_control_${channel}_${result}_${param}`);
    return parseInt(ctx.connector.private_settings[settingName], 10);
  }
  function pickEnv(param: string): number {
    const envVarName = _.upperCase(_.snakeCase(`flow_control_${channel}_${result}_${param}`));
    return parseInt(process.env[envVarName], 10);
  }
  let type = "retry";
  if (result === "success" || result === "unsupported") {
    type = "next";
  }
  return {
    type,
    size: pickPrivateSettings("size") || pickEnv("size") || defaultValues[result].size,
    in: pickPrivateSettings("in") || pickEnv("in") || defaultValues[result].in,
    in_time: pickPrivateSettings("in_time") || pickEnv("in_time") || defaultValues[result].in_time
  };
}

module.exports = notificationDefaultFlowControl;
