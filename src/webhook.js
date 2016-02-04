'use strict';

import rawBody from 'raw-body';
import crypto from './crypto';

module.exports = function WebhookHandler(config = {}, req, res, next) {
  if (config.platformId !== req.headers['hull-app-id']) {
    return next(new Error('App Id is different from configured Hull client on your side. check your platformId'));
  }

  const sig = req.headers['hull-signature'].split('.');
  const [timestamp, nonce, signature] = sig;

  rawBody(req, true, function(err, body) {
    if (err) { return err; }
    const data = [timestamp, nonce, body].join('-');
    const signed = crypto.signData(config, data);
    if (signed !== signature) {
      return next(new Error('Invalid signature'));
    }
    // Because we can't reuse streams and express middlewares
    // throw them away
    req.body = JSON.parse(body);
    return next();
  });
}
