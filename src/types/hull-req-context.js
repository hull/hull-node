/* @flow */

import type { THullSegment, THullConnector } from "./";

/**
 * Context added to the express app request by hull-node connector sdk.
 * Accessible via `req.hull` param.
 * @public
 * @memberof Types
 */
export type THullReqContext = {
  requestId: string;
  config: Object;
  token: string;
  client: Object;
  ship: THullConnector; // since ship name is deprated we move it to connector param
  connector: THullConnector;
  hostname: string;
  options: Object;

  connectorConfig: Object;
  segments: Array<THullSegment>;
  users_segments: Array<THullSegment>;
  accounts_segments: Array<THullSegment>;
  cache: Object;
  metric: Object;
  enqueue: Function;
  helpers: Object;
  service: Object;
  shipApp: Object;
  message?: Object;
  notification: Object;
  smartNotifierResponse: ?Object;
};
