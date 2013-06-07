"use strict";
var chai = require('chai'),
    sinon = require('sinon');
chai.use(require('sinon-chai'));
chai.should();

var conf = require('../lib/configuration');

describe('Configuration check', function () {
  it('should throw if no configuration is passed', function () {
    conf.check.bind(undefined).should.throw();
  });
  describe('default requirements', function () {
    it('should throw if any are missing', function () {
      conf.check.bind(undefined, {appId: true, orgUrl:true}).should.throw();
      conf.check.bind(undefined, {appId: true, appSecret:true}).should.throw();
      conf.check.bind(undefined, {orgUrl: true, appSecret:true}).should.throw();
    });
    it('should pass if all are present', function () {
      conf.check.bind(undefined, {orgUrl: true, appId: true, appSecret:true}).should.not.throw();
    });
  });
  describe('specifying custom requirements', function () {
    it('should bypass the default requirements', function () {
      conf.check.bind(undefined, {}, []).should.not.throw();
    });
    it('should throw if any of the specified requirements are missing', function () {
      conf.check.bind(undefined, {yep: true}, ['nope']).should.throw();
    });
    it('should pass if all are present', function () {
      conf.check.bind(undefined, {yep: true}, ['yep']).should.not.throw();
    });
  });
});
