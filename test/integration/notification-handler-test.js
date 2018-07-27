/* global it, describe, beforeEach, afterEach */
const express = require("express");
const superagent = require("superagent");
const bluebirdPromise = require("bluebird");
const MiniHull = require("minihull");
const sinon = require("sinon");
const { expect } = require("chai");

const { ConfigurationError, TransientError } = require("../../src/errors");
const notificationHandler = require("../../src/handlers/notification-handler/factory");
const Hull = require("../../src");

/*
 * This is the main integration test show how connector should respond in case of different errors
 */
describe("notificationHandler", () => {
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
      port: 9092,
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

    app.use("/timeout-notification", notificationHandler({
      "user:update": (ctx, messages) => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve();
          }, 125);
        });
      }
    }));
    app.use("/error-notification", notificationHandler({
      "user:update": (ctx, messages) => {
        return Promise.reject(new Error("error message"));
      }
    }));
    app.use("/transient-notification", notificationHandler({
      "user:update": (ctx, messages) => {
        return Promise.reject(new TransientError("Transient error message"));
      }
    }));
    app.use("/configuration-notification", notificationHandler({
      "user:update": (ctx, messages) => {
        return Promise.reject(new ConfigurationError("Missing API key"));
      }
    }));
    server = connector.startApp(app);
    miniHull.listen(3000).then(done);
  });

  afterEach(() => {
    server.close();
    miniHull.server.close();
  });

  it("unhandled error", function test() {
    return miniHull.notifyConnector({ id: connectorId, private_settings: {} }, "localhost:9092/error-notification", "user:update", [])
      .catch((err) => {
        expect(stopMiddlewareSpy.called).to.be.true;
        expect(err.response.statusCode).to.equal(500);
        expect(err.response.body).to.eql({
          flow_control: {
            type: "retry",
            size: 10,
            in: 1000,
            in_time: 10
          },
          error: {
            code: "N/A", message: "error message", name: "Error"
          }
        });
      });
  });
  it("timeout error", function test(done) {
    miniHull.notifyConnector({ id: connectorId, private_settings: {} }, "localhost:9092/timeout-notification", "user:update", [])
      .catch((err) => {
        expect(metricIncrementSpy.args[1]).to.eql([
          "connector.transient_error", 1, ["error_name:transient_error", "error_message:response_timeout"]
        ]);
        expect(stopMiddlewareSpy.notCalled).to.be.true;
        expect(err.response.statusCode).to.equal(503);
      });
    setTimeout(() => {
      done();
    }, 150);
  });
  it("transient error", function test() {
    return miniHull.notifyConnector({ id: connectorId, private_settings: {} }, "localhost:9092/transient-notification", "user:update", [])
      .catch((err) => {
        expect(metricIncrementSpy.args[1]).to.eql([
          "connector.transient_error", 1, ["error_name:transient_error", "error_message:transient_error_message"]
        ]);
        expect(stopMiddlewareSpy.notCalled).to.be.true;
        expect(err.response.statusCode).to.equal(503);
        expect(err.response.body).to.eql({
          flow_control: {
            type: "retry",
            in_time: 10,
            size: 10,
            in: 1000
          },
          error: {
            code: "HULL_ERR_TRANSIENT",
            message: "Transient error message",
            name: "TransientError"
          }
        });
      });
  });
  it("configuration error", function test() {
    return miniHull.notifyConnector({ id: connectorId, private_settings: {} }, "localhost:9092/configuration-notification", "user:update", [])
      .catch((err) => {
        expect(metricIncrementSpy.args[1]).to.eql([
          "connector.transient_error", 1, ["error_name:configuration_error", "error_message:missing_api_key"]
        ]);
        expect(stopMiddlewareSpy.notCalled).to.be.true;
        expect(err.response.statusCode).to.equal(503);
        expect(err.response.body).to.eql({
          flow_control: {
            type: "retry",
            in: 1000,
            in_time: 10,
            size: 10
          },
          error: {
            code: "HULL_ERR_CONFIGURATION",
            message: "Missing API key",
            name: "ConfigurationError"
          }
        });
      });
  });
});
