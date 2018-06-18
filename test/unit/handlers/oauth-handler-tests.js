/* global describe, it */
const http = require("http");
const { expect, should } = require("chai");
const sinon = require("sinon");
const httpMocks = require("node-mocks-http");
const { EventEmitter } = require("events");
const passport = require("passport");

const HullStub = require("../support/hull-stub");

const oauthHandler = require("../../../src/handlers/oauth-handler");

class StrategyStub extends passport.Strategy {
  constructor() {
    super();
    this.name = "test";
  }
  authenticate(req) {
    throw new Error("test");
  }
}

describe("OAuthHandler", () => {
  it("should handle oauth errors", (done) => {
    const request = httpMocks.createRequest({
      method: "POST",
      url: "/login"
    });
    request.hull = {
      client: new HullStub(),
      connectorConfig: {
        hostSecret: "123"
      },
      cache: {
        wrap: () => {}
      }
    };
    const response = httpMocks.createResponse({ eventEmitter: EventEmitter });
    oauthHandler({ HullClient: HullStub }, {
      name: "Test",
      Strategy: StrategyStub,
      views: {
        failure: "oauth-failure-view.html"
      }
    }).handle(request, response);
    response.on("end", () => {
      expect(response.statusCode).to.equal(200);
      expect(response._getRenderView()).to.equal("oauth-failure-view.html");
      done();
    });
  });
});
