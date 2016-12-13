/* global describe, it */
import http from "http";
import { expect, should } from "chai";
import sinon from "sinon";
import express from "express";
import Promise from "bluebird";
import CacheManager from "cache-manager";

import shipUpdate from "./fixtures/sns-messages/ship-update.json";
import userUpdate from "./fixtures/sns-messages/user-report.json";
import NotifHandler from "../src/notif-handler";
import ShipCache from "../src/ship-cache";

import HullStub from "./support/hull-stub";

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
    const client = http.request({ path: "/notify?organization=local&secret=secret&ship=ship_id", method: 'POST', port })
    client.end(JSON.stringify(body))
    client.on("response", () => callback());
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
    const notifHandler = NotifHandler(HullStub, {
      handlers: {
        "ship:update": handler
      },
      hostSecret: "test"
    });
    app.post("/notify", notifHandler);
    const server = app.listen(() => {
      const port = server.address().port;

      post({ port, body: shipUpdate })
        .then(() => {
          return post({ port, body: shipUpdate })
        })
        .then(() => {
          expect(handler.calledTwice).to.be.ok;
          expect(handler.getCall(0).args[1].ship.private_settings.value).to.equal("test");
          expect(handler.getCall(1).args[1].ship.private_settings.value).to.equal("test1");
          done();
        });
    });
  });

  it("should not bust the middleware at different events", (done) => {
    const handler = sinon.spy();
    const app = express();
    const notifHandler = NotifHandler(HullStub, {
      handlers: {
        "user:update": handler
      },
      hostSecret: "test"
    });
    app.post("/notify", notifHandler);
    const server = app.listen(() => {
      const port = server.address().port;

      post({ port, body: userUpdate })
        .then(() => {
          return post({ port, body: userUpdate })
        })
        .then(() => {
          expect(handler.calledTwice).to.be.ok;
          expect(handler.getCall(0).args[1].ship.private_settings.value).to.equal("test");
          expect(handler.getCall(1).args[1].ship.private_settings.value).to.equal("test");
          done();
        });
    });
  });

  it("should allow for ShipCache sharing", (done) => {
    const handler = sinon.spy();
    const cacheAdapter = CacheManager.caching({ store: "memory", max: 100, ttl: 1/*seconds*/ });
    const shipCache = new ShipCache(cacheAdapter);
    const app = express();
    const notifHandler = NotifHandler(HullStub, {
      handlers: {
        "user:update": handler
      },
      hostSecret: "test",
      shipCache
    });
    app.post("/notify", notifHandler);
    const server = app.listen(() => {
      const port = server.address().port;

      post({ port, body: userUpdate })
        .then(() => {
          const newShip = {
            private_settings: {
              value: "test2"
            }
          };
          return shipCache.set("ship_id", newShip);
        })
        .then(() => {
          return post({ port, body: userUpdate });
        })
        .then(() => {
          expect(handler.calledTwice).to.be.ok;
          expect(handler.getCall(0).args[1].ship.private_settings.value).to.equal("test");
          expect(handler.getCall(1).args[1].ship.private_settings.value).to.equal("test2");
          done();
        });
    });
  });
});
