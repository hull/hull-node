/* global it, describe */

var _ = require('lodash');
var chai = require('chai');
var expect = chai.expect;
chai.use(require('sinon-chai'));
chai.should();

var Client = require('../lib/client');

var config = {
  platformId: '550964db687ee7866d000057',
  platformSecret: 'abcd12345',
  orgUrl: 'https://hull-demos.hullapp.io'
};

describe('API client', function() {
  it('should return a client when called as a constructor', function() {
    var hull = new Client(config);
    hull.should.be.instanceof(Client);
  });


  it('should return an instance of the client even without new', function() {
    var clientConstructor = Client;
    var instance = clientConstructor(config);
    instance.should.be.instanceof(Client);
  });

  it('should have methods for the http verbs', function() {
    var hull = new Client(config);
    var PUBLIC_METHODS = [
      'get', 'post', 'put', 'del',
      'configuration',
      'api',
      'userToken',
      'currentUserMiddleware',
      'webhookMiddleware'
    ];

    PUBLIC_METHODS.map(function(method) {
      expect(hull[method]).to.be.a('function');
    });
  });

  describe('minimal configuration', function() {
    it('should require `platformId`', function() {
      expect(function() {
        return new Client(_.omit(config, 'platformId'));
      }).to.throw();
    });
    it('should require `platformSecret`', function() {
      expect(function() {
        return new Client(_.omit(config, 'platformSecret'));
      }).to.throw();
    });
    it('should require `orgUrl`', function() {
      expect(function() {
        return new Client(_.omit(config, 'orgUrl'));
      }).to.throw();
    });

    it('should require a valid `platformId`', function() {
      expect(function() {
        return new Client(_.extend({}, config, { platformId: true } ));
      }).to.throw();
    });
    it('should require a valid `platformSecret`', function() {
      expect(function() {
        return new Client(_.extend({}, config, { platformSecret: true } ));
      }).to.throw();
    });
    it('should require a valid `orgUrl`', function() {
      expect(function() {
        return new Client(_.extend({}, config, { orgUrl: true } ));
      }).to.throw();
    });

    it('`version` should be forced to package.json value', function() {
      var conf = new Client(_.extend({}, config, {version: 'test'})).configuration();
      conf.version.should.eql(require('../package.json').version);
    });
  });
});

