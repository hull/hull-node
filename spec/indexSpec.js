"use strict";

var chai = require('chai');
var sinon = require('sinon');
chai.use(require('sinon-chai'));
chai.should();

var hull = require('../lib/index');
var Client = require('../lib/client');

describe('module exports', function () {

  it('should be a function', function () {
    hull.should.be.a('function');
  });
  it('should have some properties', function () {
    console.dir(hull);
    hull.should.have.keys(['as', 'client', 'utils', 'middleware', 'conf', 'webhook']);
  });
  it('should return an instance of the HTTP client', function () {
    hull({appId:true, orgUrl:true, appSecret:true}).should.be.instanceOf(Client);
  });

  describe('The exported "client" property', function () {
    it('should be the same as the module exports', function () {
      hull.client.should.equal(hull);
    });
  });
});


