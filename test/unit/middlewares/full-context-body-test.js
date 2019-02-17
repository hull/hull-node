// /* global describe, it */
// const { expect } = require("chai");
// const sinon = require("sinon");
// const jwt = require("jwt-simple");
//
// const fullContextBody = require("../../../src/middlewares/full-context-body");
// const HullStub = require("../support/hull-stub");
// const connectorId = "5b606edcb1deeba01f0000d1";
//
// const clientCredentials = {
//   organization: "local",
//   secret: "secret",
//   id: connectorId
// };
// const clientCredentialsToken =
//   "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJvcmdhbml6YXRpb24iOiJsb2NhbCIsInNlY3JldCI6InNlY3JldCIsImlkIjoiNWI2MDZlZGNiMWRlZWJhMDFmMDAwMGQxIn0.7mK7dqcxHPCYwit5RKP98CjVFopsuemLDQ_y7yDd8lY";
//
// const hostSecret = "1234"
// const connectorConfig = { hostSecret };
// const hullRequest = {
//   hull: {}
// };
//
//
// describe("fullContextBody", () => {
//   // it("checks for the presence of req.hull", () => {
//   //   const instance = credentialsFromQueryMiddlewareFactory();
//   //   const next = sinon.spy();
//   //   instance({}, {}, next);
//   //   expect(next.calledOnce).to.be.true;
//   //   expect(next.args[0][0]).to.be.an("error");
//   //   expect(next.args[0][0].message).to.eql(
//   //     "Missing req.hull or req.hull.connectorConfig context object. Did you initialize Hull.Connector() ?"
//   //   );
//   // });
// });
