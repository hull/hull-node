require("babel-register")({ presets: ["es2015", "stage-0"] });
require("./client-middleware");
// TODO: rewrite tests for new arch
// require("./client-middleware-cache");
require("./notif-handler");
require("./traits-tests");
require("./firehose-batcher-tests");
