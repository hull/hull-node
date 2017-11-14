/* @flow */

import type { THullSegment, THullConnector } from "./";

/**
 * Context added to the express app request by hull connector sdk.
 * Accessible via `req.hull` param.
 */
export type THullReqContext = {
  config: Object;
  token: String;
  client: Object;

  service: Object;

  segments: Array<THullSegment>;
  ship: THullConnector;
  connector: THullConnector;

  hostname: String;
  options: Object;
  connectorConfig: Object;

  metric: Object;
  helpers: Object;
  notification: Object;

  smartNotifierResponse: Object;
}
