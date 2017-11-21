/* global describe, it */
const { expect, should } = require("chai");
const sinon = require("sinon");
const httpMocks = require("node-mocks-http");
const Promise = require("bluebird");
const hullStub = require("../support/hull-stub");

const actionHandler = require("../../../src/utils/action-handler");


describe("actionHandler", () => {
  it("should support plain truthy return values", (done) => {
    const request = httpMocks.createRequest({
      method: "POST",
      url: "/"
    });
    request.hull = {
      client: new hullStub()
    };
    const response = httpMocks.createResponse();
    actionHandler(() => {
      return "done";
    }).handle(request, response, (err) => {
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
    request.hull = {
      client: new hullStub()
    };
    const response = httpMocks.createResponse();
    actionHandler(() => {
      return new Error("Something went bad");
    }).handle(request, response, (err) => {
      expect(response.statusCode).to.equal(500);
      expect(response._isEndCalled()).to.be.ok;
      expect(response._getData()).to.equal("Something went bad");
      done();
    });
  });

  it("should support resolving promises", (done) => {
    const request = httpMocks.createRequest({
      method: "POST",
      url: "/"
    });
    request.hull = {
      client: new hullStub()
    };
    const response = httpMocks.createResponse();
    actionHandler(() => {
      return new Promise((resolve, reject) => {
        resolve("test");
      });
    }).handle(request, response, (err) => {
      expect(response.statusCode).to.equal(200);
      expect(response._isEndCalled()).to.be.ok;
      expect(response._getData()).to.equal("test");
      done();
    });
  });

  it("should support promises rejected with an error", (done) => {
    const request = httpMocks.createRequest({
      method: "POST",
      url: "/"
    });
    request.hull = {
      client: new hullStub()
    };
    const response = httpMocks.createResponse();
    actionHandler(() => {
      return new Promise((resolve, reject) => {
        reject(new Error("test"));
      });
    }).handle(request, response, (err) => {
      expect(response.statusCode).to.equal(500);
      expect(response._isEndCalled()).to.be.ok;
      expect(response._getData()).to.equal("test");
      done();
    });
  });
});
