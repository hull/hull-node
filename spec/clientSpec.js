/* global it, describe */

var _ = require('lodash');
var chai = require('chai');
var expect = chai.expect;
chai.use(require('sinon-chai'));
chai.should();

var Client = require('../lib/client');

var config = {
  id: '550964db687ee7866d000057',
  secret: 'abcd12345',
  organization: 'hull-demos'
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
      'currentUserMiddleware'
    ];

    PUBLIC_METHODS.map(function(method) {
      expect(hull[method]).to.be.a('function');
    });
  });

  describe('minimal configuration', function() {
    it('should require `id`', function() {
      expect(function() {
        return new Client(_.omit(config, 'id'));
      }).to.throw();
    });
    it('should require `secret`', function() {
      expect(function() {
        return new Client(_.omit(config, 'secret'));
      }).to.throw();
    });
    it('should require `organization`', function() {
      expect(function() {
        return new Client(_.omit(config, 'organization'));
      }).to.throw();
    });

    it('should require a valid `id`', function() {
      expect(function() {
        return new Client(_.extend({}, config, { id: true } ));
      }).to.throw();
    });
    it('should require a valid `secret`', function() {
      expect(function() {
        return new Client(_.extend({}, config, { secret: true } ));
      }).to.throw();
    });
    it('should require a valid `organization`', function() {
      expect(function() {
        return new Client(_.extend({}, config, { organization: true } ));
      }).to.throw();
    });

    it('`version` should be forced to package.json value', function() {
      var conf = new Client(_.extend({}, config, {version: 'test'})).configuration();
      conf.version.should.eql(require('../package.json').version);
    });
  });
});

