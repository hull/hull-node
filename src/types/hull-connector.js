// @flow

/**
 * Connector object with settings, private settings and manifest.json
 */
export type HullConnectorType = {
  id: string;
  name: string;
  manifest: Object;
  settings: Object;
  private_settings: Object;
  status: Object;
}
