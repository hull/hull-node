"use strict";

var chai = require('chai');
var sinon = require('sinon');
chai.use(require('sinon-chai'));
chai.should();

var hull = require('../lib/index');

describe('module exports', function () {
  it('should be a function', function () {
    hull.should.be.a('function');
  });
});

describe('the exported function', function () {
  it('should require an object as its first partameter', function () {
    hull.bind(undefined, undefined).should.throw;
    hull.bind(undefined, '').should.throw;
    hull.bind(undefined, []).should.throw;
    hull.bind(undefined, {}).should.throw;
  });
  it('should be a constructor for the client', function () {
    var instance = new hull({});
    instance.should.be.instanceof(hull);
  });
  it('should return an instance of the client even without new', function () {
    var instance = hull({});
    instance.should.be.instanceof(hull);
  });
});


