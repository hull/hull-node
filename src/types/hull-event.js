/* @flow */

/**
 * Hull Event object
 * @public
 * @memberof Types
 */
export type THullEvent = {
  event_id: string;
  event: string;
  event_source: string;
  event_type: string;
  track_id: string;
  user_id: string;
  anonymous_id: string;
  session_id: string;
  ship_id: string;
  app_id: string;
  app_name: string;
  created_at: string;
  context: Object;
  properties: Object;
};
