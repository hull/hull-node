require("babel-register")({ presets: ["es2015", "stage-0"] });

require("./app/hull-app");
require("./client-middleware");
// TODO: rewrite tests for new arch
// require("./client-middleware-cache");
require("./utils/notif-handler");
require("./traits-tests");
require("./firehose-batcher-tests");
require("./utils/service-middleware.js");
