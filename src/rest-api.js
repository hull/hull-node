import rest from "restler";
import pkg from "../package.json";

const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  "User-Agent": `Hull Node Client version: ${pkg.version}`
};

function strip(url = "") {
  if (url.indexOf("/") === 0) { return url.slice(1); }
  return url;
}

function isAbsolute(url = "") {
  return /http[s]?:\/\//.test(url);
}

function perform(config = {}, method = "get", path, params = {}) {
  const opts = {
    headers: {
      ...DEFAULT_HEADERS,
      "Hull-App-Id": config.id,
      "Hull-Access-Token": config.token,
      ...(params.headers || {})
    }
  };

  if (config.userId && typeof config.userId === "string") {
    opts.headers["Hull-User-Id"] = config.userId;
  }

  if (method === "get") {
    opts.query = params;
  } else {
    opts.data = JSON.stringify(params);
  }

  const methodCall = rest[method];
  if (!methodCall) { throw new Error(`Unsupported method ${method}`); }

  const actions = {};
  const query = methodCall(path, opts);

  const promise = new Promise((resolve, reject) => {
    actions.resolve = resolve;
    actions.reject = reject;

    query
    .on("success", actions.resolve)
    .on("error", actions.reject)
    .on("fail", actions.reject);
    return query;
  });

  promise.abort = () => {
    query.abort();
    actions.reject();
  };

  return promise;
}

function format(config, url) {
  if (isAbsolute(url)) { return url; }
  return `${config.get("protocol")}://${config.get("organization")}${config.get("prefix")}/${strip(url)}`;
}

module.exports = function restAPI(config, url, method, params) {
  const token = config.get("sudo") ? config.get("secret") : (config.get("accessToken") || config.get("secret"));
  const conf = {
    token,
    id: config.get("id"),
    secret: config.get("secret"),
    userId: config.get("userId")
  };

  const path = format(config, url);
  return perform(conf, method.toLowerCase(), path, params);
};
