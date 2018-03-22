/* @flow */
import type { $Request } from "express";
import type { THullReqContext } from "./";

/*
 * Since Hull Middleware adds new parameter to the Reuqest object from express application
 * we are providing an extended type to allow using THullReqContext
 * @public
 * @memberof Types
 */
export type THullRequest = {
  ...$Request,
  hull: THullReqContext
};
