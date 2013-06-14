"use strict";

var chai = require('chai');
var sinon = require('sinon');
var omit = require('underscore').omit;
var extend = require('underscore').extend;
chai.use(require('sinon-chai'));
chai.should();

var hull = require('../lib/index'),
    minimalConfig = {
      appId: true,
      appSecret: true,
      orgUrl: true
    };

describe('API client', function () {
  it('should be a constructor for the client', function () {
    var instance = new hull(minimalConfig);
    instance.should.be.instanceof(hull);
  });
  it('should return an instance of the client even without new', function () {
    var instance = hull(minimalConfig);
    instance.should.be.instanceof(hull);
  });
  it('should have 4 methods for the http verbs', function () {
    var client = hull(minimalConfig);
    client.should.contain.keys(['get', 'post', 'put', 'delete']);
    client.get.should.be.a('function');
    client.put.should.be.a('function');
    client.post.should.be.a('function');
    client.delete.should.be.a('function');
  });

  describe('minimal configuration', function () {
    it('should require `appId`', function () {
      hull.bind(undefined, omit(minimalConfig,'appId')).should.throw();
    });
    it('should require `appSecret`', function () {
      hull.bind(undefined, omit(minimalConfig,'appSecret')).should.throw();
    });
    it('should require `orgUrl`', function () {
      hull.bind(undefined, omit(minimalConfig,'orgUrl')).should.throw();
    });
    it('`version` should be forced to package.json value', function () {
      var conf = extend({}, minimalConfig, {version:'test'});
      var client = hull(minimalConfig);
      client.conf.version.should.eql(require('../package.json').version);
    });
  });
});

