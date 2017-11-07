// @flow

import { HullSegmentType, HullConnectorType } from "./";

/**
 * Context added to the express app request by hull connector sdk.
 * Accessible via `req.hull` param.
 */
export type HullReqContextType = {
  config: Object;
  token: String;
  client: Object;

  service: Object;

  segments: Array<HullSegmentType>;
  ship: HullConnectorType;
  connector: HullConnectorType;

  hostname: String;
  options: Object;
  connectorConfig: Object;

  metric: Object;
  helpers: Object;
  notification: Object;

  smartNotifierResponse: Object;
}
