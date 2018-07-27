/* global describe, it */
const { expect, should } = require("chai");
const sinon = require("sinon");
const httpMocks = require("node-mocks-http");
const { EventEmitter } = require("events");
const Promise = require("bluebird");
const HullStub = require("../support/hull-stub");

const actionHandler = require("../../../src/handlers/action-handler/factory");

function buildContextBaseStub() {
  return {
    HullClient: HullStub,
    clientCredentials: {
      id: "5c21c7a6b0c4ae18e1001123",
      secret: "1234",
      organization: "test.hull.local"
    },
    connector: {},
    usersSegments: [],
    accountsSegments: [],
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
      client: new HullStub(),
      connectorConfig: {
        hostSecret: "123"
      },
      connector: {},
      accountsSegments: [],
      usersSegments: [],
      clientCredentials: {
        id: "5c21c7a6b0c4ae18e1001123",
        secret: "1234",
        organization: "test.hull.local"
      },
      cache: {
        wrap: () => {}
      }
    };
    const response = httpMocks.createResponse({ eventEmitter: EventEmitter });
    actionHandler(() => {
      return Promise.resolve("done");
    }).handle(request, response);
    response.on("end", () => {
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
    actionHandler({
      callback: () => {
        return Promise.reject(new Error("Something went bad"));
      },
      options: {
        respondWithError: true
      }
    }).handle(request, response, () => {});
    response.on("end", () => {
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
    const response = httpMocks.createResponse({ eventEmitter: EventEmitter });
    actionHandler({
      callback: () => {
        throw new Error("thrown error");
      },
      options: { respondWithError: true }
    }).handle(request, response, () => {});
    response.on("end", () => {
      expect(response._isEndCalled()).to.be.ok;
      expect(response._getData()).to.equal("Error: thrown error");
      done();
    });
  });
});
