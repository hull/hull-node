/* @flow */

import type { THullSegment, THullConnector } from "./";

/**
 * Context added to the express app request by hull-node connector sdk.
 * Accessible via `req.hull` param.
 */
export type THullReqContext = {
  config: Object;
  token: String;
  client: Object;

  service: Object;
  shipApp: Object;

  segments: Array<THullSegment>;
  ship: THullConnector; // since ship name is deprated we move it to connector param
  connector: THullConnector;

  hostname: String;
  options: Object;
  connectorConfig: Object;

  metric: Object;
  helpers: Object;
  notification: Object;
  message?: Object;

  smartNotifierResponse: ?Object;
  enqueue: Function;
};
