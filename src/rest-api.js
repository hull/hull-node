'use strict';

import _ from 'lodash';
import rest from 'restler';
import Configuration from './configuration';

const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'User-Agent': `Hull Node Client version: ${Configuration.version}`
};

function strip(url = '') {
  if (url.indexOf('/') === 0 ) { return url.slice(1); }
  return url;
}

function isAbsolute(url = '') {
  return /http[s]?:\/\//.test(url);
}

function parseResponse(callback, res) {
  if ( _.isObject(res) && !_.isArray(res.data)) {
    return callback(res.data);
  }
  return callback(res);
}

function perform(config = {}, method = 'get', path, params = {}) {
  const prms = {wrapped: true, ...params};

  const opts = {
    headers: {
      ...DEFAULT_HEADERS,
      'Hull-App-Id': config.platformId,
      'Hull-Access-Token': config.accessToken || config.platformSecret,
      ...(params.headers || {})
    }
  };

  if (method === 'get') {
    opts.query = prms;
  } else {
    opts.data = JSON.stringify(prms);
  }

  const methodCall = rest[method];
  if (!methodCall) { throw new Error(`Unsupported method ${method}`); }

  const actions = {};
  const query = methodCall(path, opts);
  const promise = new Promise(function(resolve, reject) {
    actions.resolve = parseResponse.bind(this, resolve);
    actions.reject = parseResponse.bind(this, reject);

    query
    .on('success', actions.resolve)
    .on('error', actions.reject)
    .on('fail', actions.reject);
    return query;
  });
  promise.abort = function() {
    query.abort();
    actions.reject();
  };

  return promise;
}

function format(config, url) {
  if (isAbsolute(url)) { return url; }
  return `${config.get('orgUrl')}${config.get('prefix')}/${strip(url)}`;
}

export default function restAPI(config, url, method, params) {
  if (method === 'del') { method = 'delete'; }
  const conf = {
    platformId: config.get('platformId'),
    platformSecret: config.get('platformSecret'),
    accessToken: config.get('accessToken')
  };
  const path = format(config, url);
  return perform(conf, method.toLowerCase(), path, params);
}
