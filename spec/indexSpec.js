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
  it('should have some properties', function () {
    hull.should.have.keys(['client', 'utils', 'middleware']);
  });

  describe('The exported "client" property', function () {
    it('should be the same as the exported object', function () {
      hull.client.should.equal(hull);
    });
  });
});


