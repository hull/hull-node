/* global describe, it */
import http from "http";
import { expect, should } from "chai";
import sinon from "sinon";
import express from "express";
import Promise from "bluebird";

import shipUpdate from "../fixtures/sns-messages/ship-update.json";
import userUpdate from "../fixtures/sns-messages/user-report.json";
import HullStub from "../support/hull-stub";

import notifHandler from "../../src/utils/notif-handler";
import notifMiddleware from "../../src/utils/notif-middleware";



const reqStub = {
  url: "http://localhost/",
  body: '{"test":"test"}',
  query: {
    organization: "local",
    secret: "secret",
    ship: "ship_id"
  }
};

function post({ port, body }) {
  return Promise.fromCallback(function(callback) {
    const client = http.request({
      path: "/notify?organization=local&secret=secret&ship=ship_id",
      method: 'POST',
      port,
      headers: {
        "x-amz-sns-message-type": "test"
      }
    })
    client.end(JSON.stringify(body))
    client.on("response", () => callback());
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

describe("NotifHandler", () => {
  beforeEach(function beforeEachHandler() {
    this.getStub = sinon.stub(HullStub.prototype, "get");
    this.getStub.onCall(0).returns(Promise.resolve({
        id: "ship_id",
        private_settings: {
          value: "test"
        }
      }))
      .onCall(1).returns(Promise.resolve({
        id: "ship_id",
        private_settings: {
          value: "test1"
        }
      }));
  });

  afterEach(function afterEachHandler() {
    this.getStub.restore();
  });

  it("should bust the middleware at ship:update event", (done) => {
    const handler = sinon.spy();
    const app = express();
    app.use(notifMiddleware());
    app.use(mockHullMiddleware);
    app.use("/notify", notifHandler({
      handlers: {
        "ship:update": handler
      }
    }));
    const server = app.listen(() => {
      const port = server.address().port;
      post({ port, body: shipUpdate })
        .then(() => {
          return post({ port, body: shipUpdate })
        })
        .then(() => {
          expect(handler.calledTwice).to.be.ok;
          expect(handler.getCall(0).args[0].ship.private_settings.value).to.equal("test");
          expect(handler.getCall(1).args[0].ship.private_settings.value).to.equal("test1");
          done();
        });
    });
  });

  it("should handle a batch extract", (done) => {
    const handler = sinon.spy();
    const extractHandler = sinon.spy();
    const app = express();
    const body = { url: "http://localhost:9000/extract.json", format: "json" };

    app.use(notifMiddleware());
    app.use(mockHullMiddleware);
    app.use((req, res, next) => {
      req.hull.client.utils = {
        extract: {
          handle: extractHandler
        }
      };
      next();
    });
    app.use("/notify", notifHandler({
      handlers: {
        "user:update": handler
      }
    }));
    const server = app.listen(() => {
      const port = server.address().port;
      post({ port, body })
        .then(() => {
          expect(extractHandler.calledOnce).to.be.ok;
          expect(extractHandler.getCall(0).args[0].body).to.eql(body);
          done();
        });
    });
  });
});
