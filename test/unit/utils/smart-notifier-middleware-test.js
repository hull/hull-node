/* global describe, it */
const { expect } = require("chai");
const http = require("http");
const request = require("supertest");

const smartNotifierMiddleware = require("../../../src/utils/smart-notifier-middleware");


describe("SmartNotifierMiddleware", () => {
  it("should return a middleware function", () => {
    const testInstance = new smartNotifierMiddleware({});
    expect(typeof testInstance).to.equal("function");
  });

  it("should handle notifications exceeding the json size limit", (done) => {
    const testInstance = new smartNotifierMiddleware({ skipSignatureValidation: true });
    const server = http.createServer((req) => {
      testInstance(req, {}, (err) => {
        expect(err.code).to.equal("ENTITY_TOO_LARGE");
        expect(err.statusCode).to.equal(413);
        expect(err.flowControl).to.eql({
          type: "retry",
          size: 1
        });
        done();
      });
    });
    request(server)
      .post("/")
      .set("Content-Type", "application/json")
      .set({
        "content-type": "application/json",
        "x-hull-smart-notifier": "yes",
        "x-hull-smart-notifier-signature": "singature",
        "x-hull-smart-notifier-signature-version": "v1",
        "x-hull-smart-notifier-signature-public-key-url": "url"
      })
      .send({
        configuration: {
          id: "12312312312"
        },
        connector: {},
        messages: [{
          user: {
            super_long_trait: String(".").repeat(21485760)
          }
        }]
      })
      .end(() => {});
  });
});
