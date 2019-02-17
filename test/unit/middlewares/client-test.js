/* global describe, it */
const { expect } = require("chai");
const sinon = require("sinon");
const Promise = require("bluebird");

const clientMiddleware = require("../../../src/middlewares/client");
const HullStub = require("../support/hull-stub");
const connectorId = "5b606edcb1deeba01f0000d1";
const clientCredentials = {
  organization: "local",
  secret: "secret",
  id: connectorId
};
describe("clientMiddleware", function clientMiddlewareTests() {
  beforeEach(() => {
    console.log("ReqStub");
    this.reqStub = {
      query: clientCredentials,
      hull: {
        HullClient: HullStub,
        clientCredentials: {
          organization: "local",
          secret: "secret",
          ship: "ship_id"
        },
        connectorConfig: {
          hostSecret: "1234"
        }
      }
    };
    this.getStub = sinon.stub(HullStub.prototype, "get");
    this.getStub
      .onCall(0)
      .returns(
        Promise.resolve({
          id: connectorId,
          private_settings: {
            value: "test"
          }
        })
      )
      .onCall(1)
      .returns(
        Promise.resolve({
          id: connectorId,
          private_settings: {
            value: "test1"
          }
        })
      );
  });

  afterEach(() => {
    this.getStub.restore();
  });

  it("needs base request context", () => {
    const instance = clientMiddleware();
    const next = sinon.spy();
    instance({}, {}, next);
    expect(next.calledOnce).to.be.true;
    expect(next.args[0][0]).to.be.an("error");
    expect(next.args[0][0].message).to.eql(
      "Missing request context, you need to initiate it before"
    );
  });

  it("should return a clientMiddleware function", () => {
    const instance = clientMiddleware();
    const next = sinon.spy();
    instance(this.reqStub, {}, next);
    expect(next.calledOnce).to.be.true;
  });

  // TODO: notification request-id is handled by the notification middlewares/handler
  // need to move this test there
  // it("should pick up the requestId from the request headers", (done) => {
  //   const instance = clientMiddleware();
  //   const requestId = "smart-notifier:123:456:789";
  //   const reqStub = {
  //     HullClient: HullStub,
  //     headers: {
  //       "x-hull-request-id": requestId
  //     },
  //     hull: {
  //       clientCredentials,
  //       connectorConfig: {
  //         hostSecret: "1234"
  //       },
  //       client: new HullStub()
  //     }
  //   };
  //   instance(reqStub, {}, () => {
  //     const { requestId } = reqStub.hull.client.configuration();
  //     console.log(reqStub.hull.client.configuration())
  //     expect(requestId).to.equal(reqStub.headers["x-hull-request-id"]);
  //     done();
  //   });
  // });

  // it("should pick up the requestId from req.hull.requestId", function(done) {
  //   const instance = clientMiddleware();
  //   const requestId = "custom:request:123";
  //   this.reqStub.hull.requestId = requestId;
  //   instance(this.reqStub, {}, err => {
  //     const conf = this.reqStub.hull.client.configuration();
  //     expect(conf.requestId).to.equal(requestId);
  //     done();
  //   });
  // });
  //
  // it("should fetch a connector", function(done) {
  //   const instance = clientMiddleware(HullStub, { hostSecret: "secret" });
  //   instance(this.reqStub, {}, () => {
  //     console.log(this.reqStub);
  //     expect(this.reqStub.hull.connector.private_settings.value).to.equal(
  //       "test"
  //     );
  //     expect(this.getStub.calledOnce).to.be.true;
  //     done();
  //   });
  // });
  //
  // it("should fetch ship every time without caching", function(done) {
  //   const instance = clientMiddleware(HullStub, { hostSecret: "secret" });
  //   console.log(this.reqStub);
  //   instance(this.reqStub, {}, () => {
  //     expect(this.reqStub.hull.ship.private_settings.value).to.equal("test");
  //     instance(this.reqStub, {}, () => {
  //       expect(this.reqStub.hull.ship.private_settings.value).to.equal("test1");
  //       expect(this.getStub.calledTwice).to.be.true;
  //       done();
  //     });
  //   });
  // });
  //
  // it("should store a ship in cache", function(done) {
  //   const instance = clientMiddleware(HullStub, { hostSecret: "secret" });
  //   this.reqStub.hull = {
  //     cache: {
  //       cache: false,
  //       wrap: function(id, cb) {
  //         if (this.cache) {
  //           return Promise.resolve(this.cache);
  //         }
  //         return cb().then(ship => {
  //           this.cache = ship;
  //           return ship;
  //         });
  //       }
  //     }
  //   };
  //   instance(this.reqStub, {}, () => {
  //     expect(this.reqStub.hull.ship.private_settings.value).to.equal("test");
  //     instance(this.reqStub, {}, () => {
  //       expect(this.reqStub.hull.ship.private_settings.value).to.equal("test");
  //       expect(this.getStub.calledOnce).to.be.true;
  //       done();
  //     });
  //   });
  // });
  //
  // it("should bust the cache for specific requests", function(done) {
  //   const instance = clientMiddleware(HullStub, { hostSecret: "secret" });
  //   instance(this.reqStub, {}, () => {
  //     expect(this.reqStub.hull.ship.private_settings.value).to.equal("test");
  //     this.reqStub.hull.message = {
  //       Subject: "ship:update"
  //     };
  //     instance(this.reqStub, {}, () => {
  //       expect(this.reqStub.hull.ship.private_settings.value).to.equal("test1");
  //       expect(this.getStub.calledTwice).to.be.true;
  //       done();
  //     });
  //   });
  // });
  //
  // it("should take an optional `clientConfig` param", function(done) {
  //   const hullSpy = sinon.stub();
  //   const instance = clientMiddleware(hullSpy, {
  //     hostSecret: "secret",
  //     clientConfig: { flushAt: 123, connector_name: "foo" }
  //   });
  //   instance(this.reqStub, {}, () => {
  //     expect(
  //       hullSpy.calledWith({
  //         id: "ship_id",
  //         secret: "secret",
  //         organization: "local",
  //         flushAt: 123,
  //         connector_name: "foo",
  //         requestId: this.reqStub.headers["x-hull-request-id"]
  //       })
  //     ).to.be.true;
  //     done();
  //   });
  // });
});
