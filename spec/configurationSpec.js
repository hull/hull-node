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
  describe('defaults properties to be checked', function () {
    it('should be exposed', function () {
      conf.check.defaults.should.eql(['appId', 'appSecret', 'orgUrl']);
    });
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
  describe('global configuration', function () {
    describe('getting the global configuration', function () {
      it('should always return a new object', function () {
        conf.get().should.not.be.equal(conf.get());
      });
      it('should have thre same properties', function () {
        conf.defaults({a:'a'});
        conf.get().should.eql(conf.get());
      });
    });
    it('should have an empty default configuration', function () {
      Object.keys(conf.get()).should.be.empty;
    });
    it('should be possible to redefine the global conf', function () {
      conf.defaults({a:'a'});
      conf.get().should.eql({a:'a'});
    });
    it('should be possible to reset the conf', function () {
      conf.defaults({a: 'a'});
      conf.reset();
      Object.keys(conf.get()).should.be.empty;
    });
    describe('extending the global conf', function () {
      it('should return a new object', function () {
        var _default = conf.get();
        conf.extend({a: 'a'}).should.not.be.equal(_default);
      });
      it('should not override the default conf', function () {
        var _default = conf.get();
        conf.extend({a: 'a'}).should.not.be.equal(_default);
        _default.should.eql(conf.get());
      });
      it('should be the same with an empty extension', function () {
        var _default = conf.get();
        var extended = conf.extend();
        _default.should.eql(_default);
        _default.should.not.be.equal(extended);
      });
      it('should merge the properties in a new object', function () {
        conf.extend({a: 'a'}).should.contain.keys(Object.keys(conf.get()));
        conf.extend({a: 'a'}).should.contain.keys(['a']);
      });
    });
  });
});
