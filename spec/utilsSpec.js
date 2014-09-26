"use strict";
var chai = require('chai'),
    sinon = require('sinon'),
    jwt = require('jwt-simple'),
    utils = require('../lib/utils.js');
chai.use(require('sinon-chai'));
chai.should();

describe('utils', function () {
  describe('buildAccessToken', function () {
    var user = {
      external_id: 'foo'
    };
    var config = {
      appId: 'appid',
      appSecret: 'secret'
    };
    it ('should sign a jwt for user hash', function () {
      var token = jwt.decode(utils.buildAccessToken(config, user), config.appSecret);
      token.should.have.property('io.hull.user');
      token.should.not.have.property('sub');
    });
    it ('should sign a jwt for a user id', function () {
      var token = jwt.decode(utils.buildAccessToken(config, 'user'), config.appSecret);
      token.should.not.have.property('io.hull.user');
      token.should.have.property('sub');
    });
  });
});
