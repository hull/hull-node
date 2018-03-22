/* global it, describe, beforeEach, afterEach */
const express = require("express");
const superagent = require("superagent");
const bluebirdPromise = require("bluebird");
const MiniHull = require("minihull");
const sinon = require("sinon");
const { expect } = require("chai");

const { ConfigurationError, TransientError } = require("../../src/errors");
const smartNotifierHandler = require("../../src/utils/smart-notifier-handler");
const Hull = require("../../src");

/*
 * This is the main integration test show how connector should respond in case of different errors
 */
describe("Hull Connector error handling", () => {
  // this agent accepts every response no matter what is the status code
  // const agent = superagent.agent()
  //     .ok(() => true);
  let connector;
  let app;
  let server;
  let miniHull;
  let connectorId;
  let stopMiddlewareSpy;
  let metricIncrementSpy;

  beforeEach((done) => {
    miniHull = new MiniHull();
    connectorId = miniHull.fakeId();
    miniHull.stubConnector({
      id: connectorId,
      private_settings: {
        enrich_segments: ["1"]
      }
    });

    app = express();
    connector = new Hull.Connector({
      port: 9090,
      timeout: "100ms",
      skipSignatureValidation: true,
      hostSecret: "1234",
      clientConfig: {
        protocol: "http"
      }
    });
    stopMiddlewareSpy = sinon.spy((err, req, res, next) => {
      next(err);
    });
    metricIncrementSpy = sinon.spy();
    connector.instrumentation.stopMiddleware = () => stopMiddlewareSpy;
    connector.setupApp(app);
    app.use((req, res, next) => {
      req.hull.metric.increment = metricIncrementSpy;
      next();
    });

    app.use("/timeout-smart-notifier", smartNotifierHandler({
      handlers: {
        "user:update": (ctx, messages) => {
          return new Promise((resolve, reject) => {
            setTimeout(() => {
              resolve();
            }, 125);
          });
        }
      }
    }));
    app.use("/error-smart-notifier", smartNotifierHandler({
      handlers: {
        "user:update": (ctx, messages) => {
          return Promise.reject(new Error("error message"));
        }
      }
    }));
    app.use("/transient-smart-notifier", smartNotifierHandler({
      handlers: {
        "user:update": (ctx, messages) => {
          return Promise.reject(new TransientError("Transient error message"));
        }
      }
    }));
    app.use("/configuration-smart-notifier", smartNotifierHandler({
      handlers: {
        "user:update": (ctx, messages) => {
          return Promise.reject(new ConfigurationError("Missing API key"));
        }
      }
    }));

    app.post("/error-endpoint", () => {
      throw new Error();
    });
    app.post("/transient-endpoint", () => {
      throw new TransientError("Some Message");
    });
    app.post("/configuration-endpoint", () => {
      throw new ConfigurationError("Missing API Key");
    });
    app.post("/timeout-endpoint", (req, res) => {
      setTimeout(() => {
        res.json({ foo: "bar" });
      }, 125);
    });
    server = connector.startApp(app);
    miniHull.listen(3000).then(done);
  });

  afterEach(() => {
    server.close();
    miniHull.server.close();
  });

  describe("smart-notifier endpoint", () => {
    it("unhandled error", function test() {
      return miniHull.smartNotifyConnector({ id: connectorId }, "localhost:9090/error-smart-notifier", "user:update", [])
        .catch((err) => {
          expect(stopMiddlewareSpy.called).to.be.true;
          expect(err.response.statusCode).to.equal(500);
          expect(err.response.body).to.eql({
            flow_control: {
              type: "retry",
              in: 1000
            },
            metrics: [],
            errors: [{
              code: "N/A", reason: "error message"
            }]
          });
        });
    });
    it("timeout error", function test(done) {
      miniHull.smartNotifyConnector({ id: connectorId }, "localhost:9090/timeout-smart-notifier", "user:update", [])
        .catch((err) => {
          expect(metricIncrementSpy.args[0]).to.eql([
            "connector.transient_error", 1, ["error_name:service_unavailable_error", "error_message:response_timeout"]
          ]);
          expect(stopMiddlewareSpy.notCalled).to.be.true;
          expect(err.response.statusCode).to.equal(503);
        });
      setTimeout(() => {
        done();
      }, 150);
    });
    it("transient error", function test() {
      return miniHull.smartNotifyConnector({ id: connectorId }, "localhost:9090/transient-smart-notifier", "user:update", [])
        .catch((err) => {
          expect(metricIncrementSpy.args[0]).to.eql([
            "connector.transient_error", 1, ["error_name:transient_error", "error_message:transient_error_message"]
          ]);
          expect(stopMiddlewareSpy.notCalled).to.be.true;
          expect(err.response.statusCode).to.equal(503);
          expect(err.response.body).to.eql({
            flow_control: {
              type: "retry",
              in: 1000
            },
            metrics: [],
            errors: [{
              code: "N/A",
              reason: "Transient error message"
            }]
          });
        });
    });
    it("configuration error", function test() {
      return miniHull.smartNotifyConnector({ id: connectorId }, "localhost:9090/configuration-smart-notifier", "user:update", [])
        .catch((err) => {
          expect(metricIncrementSpy.args[0]).to.eql([
            "connector.transient_error", 1, ["error_name:configuration_error", "error_message:missing_api_key"]
          ]);
          expect(stopMiddlewareSpy.notCalled).to.be.true;
          expect(err.response.statusCode).to.equal(503);
          expect(err.response.body).to.eql({
            flow_control: {
              type: "retry",
              in: 1000
            },
            metrics: [],
            errors: [{
              code: "N/A",
              reason: "Missing API key"
            }]
          });
        });
    });
  });

  describe("post endpoint", () => {
    it("should handle unhandled error", () => {
      return miniHull.postConnector(connectorId, "localhost:9090/error-endpoint")
        .catch((err) => {
          expect(stopMiddlewareSpy.called).to.be.true;
          expect(err.response.statusCode).to.equal(500);
          expect(err.response.text).to.equal("unhandled-error");
        });
    });
    it("transient error", () => {
      return miniHull.postConnector(connectorId, "localhost:9090/transient-endpoint")
        .catch((err) => {
          expect(metricIncrementSpy.args[0]).to.eql([
            "connector.transient_error", 1, ["error_name:transient_error", "error_message:some_message"]
          ]);
          expect(stopMiddlewareSpy.notCalled).to.be.true;
          expect(err.response.statusCode).to.equal(503);
          expect(err.response.text).to.equal("transient-error");
        });
    });
    it("configuration error", () => {
      return miniHull.postConnector(connectorId, "localhost:9090/configuration-endpoint")
        .catch((err) => {
          expect(metricIncrementSpy.args[0]).to.eql([
            "connector.transient_error", 1, ["error_name:configuration_error", "error_message:missing_api_key"]
          ]);
          expect(stopMiddlewareSpy.notCalled).to.be.true;
          expect(err.response.statusCode).to.equal(503);
          expect(err.response.text).to.equal("transient-error");
        });
    });
    it("should handle timeout error", function test(done) {
      miniHull.postConnector(connectorId, "localhost:9090/timeout-endpoint")
        .catch((err) => {
          expect(metricIncrementSpy.args[0]).to.eql([
            "connector.transient_error", 1, ["error_name:service_unavailable_error", "error_message:response_timeout"]
          ]);
          expect(stopMiddlewareSpy.notCalled).to.be.true;
          expect(err.response.statusCode).to.equal(503);
          expect(err.response.text).to.equal("transient-error");
        });
      setTimeout(() => {
        done();
      }, 150);
    });
  });
});
