/* global describe, it */
import {
  expect,
  should
} from "chai";
import sinon from "sinon";
import express from "express";
import Promise from "bluebird";

import smartNotifierHandler from "../../src/utils/smart-notifier-handler";
import smartNotifierMiddleware from "../../src/utils/smart-notifier-middleware";
import smartNotifierErrorMiddleware from "../../src/utils/smart-notifier-error-middleware";
import requestClient from "request";
import HullStub from "../unit/support/hull-stub";

const flowControls = require("../../src/utils/smart-notifier-flow-controls")
const chai = require('chai');
const chaiHttp = require('chai-http');

chai.use(chaiHttp);
const app = express();
const handler = function(ctx, messages) {
  return new Promise(function(fulfill, reject) {
    if (messages[0].outcome === "SUCCESS") {
      fulfill({});
    } else if (messages[0].outcome === "FAILURE") {
      reject({});
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
app.use(smartNotifierErrorMiddleware);

const server = app.listen();

describe("SmartNotifierHandler", () => {

  const app = express();
  const handler = sinon.spy();

  it("should return an express router function", () => {
    const testInstance = new smartNotifierHandler({});
    expect(typeof testInstance).to.equal("function");
  });

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
        expect(res.body.errors).to.be.empty;
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
        expect(res.body.errors).to.be.empty;
        expect(res.body.flow_control).to.be.an('object');
        expect(res.body.flow_control.type).to.be.equal('retry');
        expect(res.body.flow_control).to.deep.equal(flowControls.defaultErrorFlowControl);
        done();
      });
  });


});
