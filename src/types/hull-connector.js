/* @flow */

/**
 * Connector (also called ship) object with settings, private settings and manifest.json
 */
export type THullConnector = {
  id: string;
  updated_at: string;
  created_at: string;
  name: string;
  description: string;
  tags: Array<string>;
  manifest: Object;
  settings: Object;
  private_settings: Object;
  status: Object;
};
