"use strict";
var chai = require('chai'),
    sinon = require('sinon');
chai.use(require('sinon-chai'));
chai.should();

var request = require('../lib/request');

describe('Request Module', function () {
  describe('API', function () {
    it('should be a function', function () {
      request.should.be.a('function');
    });
    it('should return a function', function () {
      request().should.be.a('function');
    });
  });

  //@TODO Use a stub with a mock library to perform in-depth tests
});

