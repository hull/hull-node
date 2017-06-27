/* global it, describe */

const _ = require("lodash");
const sinon = require("sinon");
const chai = require("chai");
const expect = chai.expect;
chai.use(require("sinon-chai"));
chai.should();

let Configuration = require("../src/configuration"),
  config = {
    id: "550964db687ee7866d000057",
    secret: "abcd12345",
    organization: "hull-demos.hullapp.io"
  };


describe("Configuration check", function () {
  it("should throw if no configuration is passed", function () {
    expect(function () {
      new Configuration();
    }).to.throw();
  });

  describe("default requirements", function () {
    it("should throw if any are missing", function () {
      expect(function () {
        new Configuration({ appId: true, organization: true });
      }).to.throw();
      expect(function () {
        new Configuration({ appId: true, appSecret: true });
      }).to.throw();
      expect(function () {
        new Configuration({ organization: true, appSecret: true });
      }).to.throw();
    });

    it("should throw if they are invalid", function () {
      expect(function () {
        new Configuration({ organization: true, appId: true, appSecret: true });
      }).to.throw();
    });

    it("should pass if they are valid", function () {
      expect(function () {
        new Configuration(config);
      }).to.not.throw();
    });
  });

  describe("global configuration", function () {
    describe("getting the global configuration", function () {
      it("should always return a new object", function () {
        const conf = new Configuration(config);
        conf.get().should.not.be.equal(conf.get());
      });
      it("should have thre same properties", function () {
        const conf = new Configuration(config);
        conf.get().should.eql(conf.get());
      });
    });
  });
});
