"use strict";
/* global it, describe */

var _ = require('lodash');
var sinon = require('sinon');
var chai = require('chai');
var expect = chai.expect;
chai.use(require('sinon-chai'));
chai.should();

var Client = require('../lib/client'),
    config = {
      platformId: '550964db687ee7866d000057',
      platformSecret: 'abcd12345',
      orgUrl: 'https://hull-demos.hullapp.io'
    };

describe('API client', function() {
  it('should return a client when called as a constructor', function() {
    var hull = new Client(config);
    hull.should.be.instanceof(Client);
  });

  it('should return a client when called directly', function() {
    var hull = Client(config);
    hull.should.be.instanceof(Client);
  });

  // it('should return an instance of the client even without new', function() {
  //   var instance = Client(config);
  //   instance.should.be.instanceof(Client);
  // });

  it('should have methods for the http verbs', function() {
    var hull = new Client(config);
    expect(hull).to.contain.keys(['get', 'post', 'put', 'del', 'configuration', 'api', 'userToken', 'currentUserMiddleware', 'webhookMiddleware']);

    expect(hull.configuration).to.be.a('function');
    expect(hull.api).to.be.a('function');

    expect(hull.userToken).to.be.a('function');
    expect(hull.currentUserMiddleware).to.be.a('function');
    expect(hull.webhookMiddleware).to.be.a('function');

    expect(hull.get).to.be.a('function');
    expect(hull.put).to.be.a('function');
    expect(hull.post).to.be.a('function');
    expect(hull.del).to.be.a('function');

  });

  describe('minimal configuration', function() {
    it('should require `platformId`', function() {
      expect(function() {
        new Client(_.omit(config, 'platformId'));
      }).to.throw();
    });
    it('should require `platformSecret`', function() {
      expect(function() {
        new Client(_.omit(config, 'platformSecret'));
      }).to.throw();
    });
    it('should require `orgUrl`', function() {
      expect(function() {
        new Client(_.omit(config, 'orgUrl'));
      }).to.throw();
    });

    it('should require a valid `platformId`', function() {
      var hull = expect(function(){
        new Client(_.extend({}, config, {platformId:true} ));
      }).to.throw();
    });
    it('should require a valid `platformSecret`', function() {
      var hull = expect(function(){
        new Client(_.extend({}, config, {platformSecret:true} ));
      }).to.throw();
    });
    it('should require a valid `orgUrl`', function() {
      var hull = expect(function(){
        new Client(_.extend({}, config, {orgUrl:true} ));
      }).to.throw();
    });

    it('`version` should be forced to package.json value', function() {
      var conf = _.extend({}, config, {version: 'test'});
      var hull = new Client(conf);
      
      console.log('--------------');
      console.log('--------------');
      console.log(hull.configuration());
      hull.configuration()['version'].should.eql(require('../package.json').version);
    });
  });

});

