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

function perform(config = {}, method = "get", path, params = {}, options = {}) {
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

  if (options.timeout) {
    opts.timeout = options.timeout;
  }

  if (method === "get") {
    opts.query = params;
  } else {
    opts.data = JSON.stringify(params);
  }

  const methodCall = rest[method];
  if (!methodCall) { throw new Error(`Unsupported method ${method}`); }

  const actions = {};
  let retryCount = 0;
  const query = methodCall(path, opts);

  const promise = new Promise((resolve, reject) => {
    actions.resolve = resolve;
    actions.reject = reject;

    query
    .on("success", actions.resolve)
    .on("error", actions.reject);

    if (method === "get") {
      options.timeout = 10000;
    }

    query.on("fail", function handleError(body, response) {
      if (response.statusCode === 503 && options.timeout && retryCount < 2) {
        retryCount += 1;
        return this.retry(options.retry || 500);
      }
      return actions.reject();
    });

    if (options.timeout) {
      query.on("timeout", function handleTimeout() {
        if (retryCount < 2) {
          retryCount += 1;
          return this.retry(options.retry || 500);
        }
        return actions.reject();
      });
    }
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

module.exports = function restAPI(config, url, method, params, options = {}) {
  const token = config.get("sudo") ? config.get("secret") : (config.get("accessToken") || config.get("secret"));
  const conf = {
    token,
    id: config.get("id"),
    secret: config.get("secret"),
    userId: config.get("userId")
  };

  const path = format(config, url);
  return perform(conf, method.toLowerCase(), path, params, options);
};
