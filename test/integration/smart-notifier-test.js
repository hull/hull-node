/* global describe, it */
const {
  expect,
  should
} = require("chai");
const sinon = require("sinon");
const express = require("express");
const Promise = require("bluebird");

const smartNotifierHandler = require("../../src/utils/smart-notifier-handler");
const smartNotifierMiddleware = require("../../src/utils/smart-notifier-middleware");
const smartNotifierErrorMiddleware = require("../../src/utils/smart-notifier-error-middleware");
const requestClient = require("request");
const HullStub = require("../unit/support/hull-stub");

const flowControls = require("../../src/utils/smart-notifier-flow-controls");
const chai = require('chai');
const chaiHttp = require('chai-http');

chai.use(chaiHttp);
const app = express();
const handler = function(ctx, messages) {
  return new Promise(function(fulfill, reject) {
    if (messages[0].outcome === "SUCCESS") {
      fulfill({});
    } else if (messages[0].outcome === "FAILURE") {
      reject(new Error("FAILED"));
    } else {
      throw new Error("Simulating error in connector code");
    }
  });
}

function mockHullMiddleware(req, res, next) {
  req.hull = req.hull || {};
  req.hull.client = new HullStub();
  req.hull.client.get()
    .then(ship => {
      req.hull.ship = ship;
      next();
    });
}
app.use(mockHullMiddleware);

app.use(smartNotifierMiddleware({
  skipSignatureValidation: true
}));
app.use("/notify", smartNotifierHandler({
  handlers: {
    "user:update": handler
  }
}));
app.use(smartNotifierErrorMiddleware());

const server = app.listen();

describe("SmartNotifierHandler", () => {

  const app = express();
  const handler = sinon.spy();

  it("should return a next flow control", (done) => {
    let notification = {
      notification_id: '0123456789',
      channel: 'user:update',
      configuration: {},
      messages: [{
        outcome: "SUCCESS"
      }]
    };

    chai.request(server)
      .post('/notify')
      .send(notification)
      .set('X-Hull-Smart-Notifier', 'true')
      .end((err, res) => {
        expect(res.status).to.equal(200);
        expect(res.headers['content-type']).to.have.string('application/json');
        expect(res.body.errors).to.be.an('array');
        expect(res.body.errors).to.be.empty;
        expect(res.body.flow_control).to.be.an('object');
        expect(res.body.flow_control.type).to.be.equal('next');
        expect(res.body.flow_control).to.deep.equal(flowControls.defaultSuccessFlowControl);
        done();
      });
  });

  it("should return a retry flow control", (done) => {
    let notification = {
      notification_id: '0123456789',
      channel: 'user:update',
      configuration: {},
      messages: [{
        outcome: "FAILURE"
      }]
    };

    chai.request(server)
      .post('/notify')
      .send(notification)
      .set('X-Hull-Smart-Notifier', 'true')
      .end((err, res) => {
        expect(res.status).to.equal(500);
        expect(res.headers['content-type']).to.have.string('application/json');
        expect(res.body.errors).to.be.an('array');
        expect(res.body.errors.length).to.be.equal(1);
        expect(res.body.errors[0].reason).to.be.equal("FAILED");
        expect(res.body.flow_control).to.be.an('object');
        expect(res.body.flow_control.type).to.be.equal('retry');
        expect(res.body.flow_control).to.deep.equal(flowControls.defaultErrorFlowControl);
        done();
      });
  });

  it("should return a retry flow control when promise rejection is not handled properly", (done) => {
    let notification = {
      notification_id: '0123456789',
      channel: 'user:update',
      configuration: {},
      messages: [{
        outcome: "FAILURE_WITHOUT_REJECT"
      }]
    };

    chai.request(server)
      .post('/notify')
      .send(notification)
      .set('X-Hull-Smart-Notifier', 'true')
      .end((err, res) => {
        expect(res.status).to.equal(500);
        expect(res.headers['content-type']).to.have.string('application/json');
        expect(res.body.errors).to.be.an('array');
        expect(res.body.errors.length).to.be.equal(1);
        expect(res.body.errors[0].reason).to.be.equal("Simulating error in connector code");
        expect(res.body.flow_control).to.be.an('object');
        expect(res.body.flow_control.type).to.be.equal('retry');
        expect(res.body.flow_control).to.deep.equal(flowControls.defaultErrorFlowControl);
        done();
      });
  });

  it("should return a next flow control when channel is not supported", (done) => {
    let notification = {
      notification_id: '0123456789',
      channel: 'unknown:update',
      configuration: {},
      messages: [{
        outcome: "FAILURE_WITHOUT_REJECT"
      }]
    };

    chai.request(server)
      .post('/notify')
      .send(notification)
      .set('X-Hull-Smart-Notifier', 'true')
      .end((err, res) => {
        expect(res.status).to.equal(200);
        expect(res.headers['content-type']).to.have.string('application/json');
        expect(res.body.flow_control).to.be.an('object');
        expect(res.body.flow_control.type).to.be.equal('next');
        expect(res.body.flow_control.size).to.be.equal(100);
        expect(res.body.flow_control).to.deep.equal(flowControls.unsupportedChannelFlowControl);
        done();
      });
  });

});
