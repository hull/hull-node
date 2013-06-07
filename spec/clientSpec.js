
var hull = require('../lib/index'),
    minimalConfig = {
      appId: true,
      appSecret: true,
      orgUrl: true
    };

describe('API client', function () {
  it('should require an object with specific properties as its first partameter', function () {
    hull.bind(undefined, undefined).should.throw();
    hull.bind(undefined, '').should.throw();
    hull.bind(undefined, []).should.throw();
    hull.bind(undefined, {}).should.throw();
    hull.bind(undefined, minimalConfig).should.not.throw;
  });
  it('should be a constructor for the client', function () {
    var instance = new hull(minimalConfig);
    instance.should.be.instanceof(hull);
  });
  it('should return an instance of the client even without new', function () {
    var instance = hull(minimalConfig);
    instance.should.be.instanceof(hull);
  });
});



