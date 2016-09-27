require("babel-register")({ presets: ["es2015", "stage-0"] });
require("./client-middleware");
require("./client-middleware-cache");
require("./traits-tests");
require("./firehose-batcher-tests");
