'use strict';

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

function perform(config = {}, method, path, params = {}) {
  const opts = {
    data: JSON.stringify(params),
    headers: {
      ...DEFAULT_HEADERS,
      'Hull-App-Id': config.platformId,
      'Hull-Access-Token': config.accessToken || config.platformSecret,
      ...(params.headers || {})
    }
  };
  const methodCall = rest[method];
  if (!methodCall) { throw new Error(`Unsupported method ${method}`); }

  const promise = new Promise(function(resolve, reject) {
    const query = methodCall(path, opts)
    .on('success', function(data, response) {
      resolve(data);
      console.log(response);
    })
    .on('error', reject)
    .on('fail', reject);
    promise.abort = function() { query.abort(); };
    return query;
  });

  return promise;
}

function format(config, url) {
  if (isAbsolute(url)) { return url; }
  return `${config.get('orgUrl')}${config.statics('prefix')}/${strip(url)}`;
}

export default function restAPI(config, url, method, params) {
  if (method === 'del') { method = 'delete'; }
  const conf = {
    platformId: config.get('platformId'),
    platformSecret: config.get('platformSecret'),
    accessToken: config.get('accessToken')
  };
  const path = format(config, url);
  return perform(conf, method, path, params);
}
