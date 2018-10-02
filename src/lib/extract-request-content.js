// @flow

import _ from "lodash";
import type { HullExternalHandlerMessage } from "../types";
import type { $Request } from "express";

module.exports = (req: $Request): HullExternalHandlerMessage =>
  _.pick(req, [
    "body",
    "cookies",
    "hostname",
    "ip",
    "ips",
    "method",
    "params",
    "path",
    "protocol",
    "query",
    "headers",
    "url"
  ]);
