// This is an extended req.hull object, with all major dependencies added:
export default const HullContext = {
  // basic REST HTTP API actions:
  client: {
    get: () => {},
    post: () => {},
    put: () => {},
    delete: () => {},

    as: () => {
      return {
        track: () => {},
        traits: () => {},
      };
    },

    logger: {
      info: () => {},
    },
  },

  // ship configuration object
  ship: {},

  // hostname of the ship instance (include it in the ship object?)
  hostname: req.hostname,

  // OPTIONAL - an array of organization segments
  segments: []

  // cache of the ship object
  cache: {
    get: () => {},
    del: () => {},
  },

  // method to queue jobs to internal queue
  enqueue: (jobName, jobPayload = {}, options = { delay: 100 }) => {},

  // set of methods to gather metrics
  metric: {
    value: () => {},
    increment: () => {},
    event: () => {}
  },

  // OPTIONAL - a namespace for custom 3rd party tooling
  // following structure is an official way of doing this™,
  // yet may be adjusted freely by ship developer
  service: {
    client: {
      get: () => {},
      post: () => {},
      put: () => {},
      delete: () => {},
      refreshToken: () => {},
      addDomain: () => {},
      getDomainInfo: () => {},
    },
    fetchUsers: () => {},
    tagUsers: () => {}
    // other methods to peform tasks on the 3rd party api
  }
};
