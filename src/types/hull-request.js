/* @flow */
import type { $Request } from "express";
import type { THullReqContext } from "./";

/**
 * Since Hull Middleware adds new parameter to the Reuqest object from express application
 * we are providing an extended type to allow using THullReqContext
 */
export type THullRequest = {
  ...$Request,
  hull: THullReqContext,
  shipApp?: {
    [any]: any
  },
  service?: {
    [any]: any
  }
};
