/* @flow */

/**
 * Connector (also called ship) object with settings, private settings and manifest.json
 */
export type THullConnector = {
  id: string;
  name: string;
  manifest: Object;
  settings: Object;
  private_settings: Object;
  status: Object;
};
