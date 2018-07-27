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
describe("plain post routes", () => {
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
      port: 9091,
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

  it("should handle unhandled error", () => {
    return miniHull.postConnector(connectorId, "localhost:9091/error-endpoint")
      .catch((err) => {
        expect(stopMiddlewareSpy.called).to.be.true;
        expect(err.response.statusCode).to.equal(500);
        expect(err.response.text).to.equal("unhandled-error");
      });
  });
  it("transient error", () => {
    return miniHull.postConnector(connectorId, "localhost:9091/transient-endpoint")
      .catch((err) => {
        expect(stopMiddlewareSpy.called).to.be.true;
        expect(err.response.statusCode).to.equal(500);
        expect(err.response.text).to.equal("unhandled-error");
      });
  });
  it("configuration error", () => {
    return miniHull.postConnector(connectorId, "localhost:9091/configuration-endpoint")
      .catch((err) => {
        expect(stopMiddlewareSpy.called).to.be.true;
        expect(err.response.statusCode).to.equal(500);
        expect(err.response.text).to.equal("unhandled-error");
      });
  });
  it("should handle timeout error", function test(done) {
    miniHull.postConnector(connectorId, "localhost:9091/timeout-endpoint")
      .catch((err) => {
        expect(stopMiddlewareSpy.called).to.be.true;
        expect(err.response.statusCode).to.equal(500);
        expect(err.response.text).to.equal("unhandled-error");
      });
    setTimeout(() => {
      done();
    }, 150);
  });
});
