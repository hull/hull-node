/* global describe, it */
const { expect, should } = require("chai");
const sinon = require("sinon");
const httpMocks = require("node-mocks-http");
const { EventEmitter } = require("events");
const Promise = require("bluebird");
const hullStub = require("../support/hull-stub");

const actionHandler = require("../../../src/handlers/action-handler");

const deps = {
  clientMiddleware: () => {
    return (req, res, next) => {
      next();
    };
  }
};

function buildContextBaseStub() {
  return {
    client: new hullStub(),
    connectorConfig: {
      hostSecret: "123"
    },
    cache: {
      wrap: () => {}
    }
  };
}

describe("actionHandler", () => {
  it("should support plain truthy return values", (done) => {
    const request = httpMocks.createRequest({
      method: "POST",
      url: "/"
    });
    request.hull = {
      client: new hullStub(),
      connectorConfig: {
        hostSecret: "123"
      },
      cache: {
        wrap: () => {}
      }
    };
    const response = httpMocks.createResponse({ eventEmitter: EventEmitter });
    actionHandler(deps, () => {
      return Promise.resolve("done");
    }).handle(request, response);
    response.on("end", () => {
      expect(response.statusCode).to.equal(200);
      expect(response._isEndCalled()).to.be.ok;
      expect(response._getData()).to.equal("done");
      done();
    });
  });

  it("should support plain error return values", (done) => {
    const request = httpMocks.createRequest({
      method: "POST",
      url: "/"
    });
    request.hull = buildContextBaseStub();
    const response = httpMocks.createResponse({ eventEmitter: EventEmitter });
    actionHandler(deps, () => {
      return Promise.reject(new Error("Something went bad"));
    }, { respondWithError: true }).handle(request, response, () => {});
    response.on("end", () => {
      expect(response.statusCode).to.equal(500);
      expect(response._isEndCalled()).to.be.ok;
      expect(response._getData()).to.equal("Error: Something went bad");
      done();
    });
  });

  it("should support thrown errors", (done) => {
    const request = httpMocks.createRequest({
      method: "POST",
      url: "/"
    });
    request.hull = buildContextBaseStub();
    const response = httpMocks.createResponse();
    actionHandler(deps, () => {
      throw new Error("thrown error");
    }, { respondWithError: true }).handle(request, response, () => {});
    response.on("end", () => {
      expect(response.statusCode).to.equal(500);
      expect(response._isEndCalled()).to.be.ok;
      expect(response._getData()).to.equal("Error: thrown error");
      done();
    });
  });
});
