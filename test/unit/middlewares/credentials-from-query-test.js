/* global describe, it */
const { expect } = require("chai");
const sinon = require("sinon");
const jwt = require("jwt-simple");

const credentialsFromQueryMiddleware = require("../../../src/middlewares/credentials-from-query");
const connectorId = "5b606edcb1deeba01f0000d1";

const clientCredentials = {
  organization: "local",
  secret: "secret",
  id: connectorId
};
const clientCredentialsToken =
  "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJvcmdhbml6YXRpb24iOiJsb2NhbCIsInNlY3JldCI6InNlY3JldCIsImlkIjoiNWI2MDZlZGNiMWRlZWJhMDFmMDAwMGQxIn0.7mK7dqcxHPCYwit5RKP98CjVFopsuemLDQ_y7yDd8lY";

const hostSecret = "1234";
const connectorConfig = { hostSecret };
const decode = token => jwt.decode(token, hostSecret);

describe("credentialsFromQueryMiddleware", () => {
  it("checks for the presence of req.hull", () => {
    const instance = credentialsFromQueryMiddleware();
    const next = sinon.spy();
    instance({}, {}, next);
    expect(next.calledOnce).to.be.true;
    expect(next.args[0][0]).to.be.an("error");
    expect(next.args[0][0].message).to.eql(
      "Missing req.hull or req.hull.connectorConfig context object. Did you initialize Hull.Connector() ?"
    );
  });

  it("uses clientCredentials over the clientCredentialsToken", () => {
    const instance = credentialsFromQueryMiddleware();
    const next = sinon.spy();
    const req = {
      hull: {
        connectorConfig,
        clientCredentials,
        clientCredentialsToken: "foo"
      },
      query: {
        token: "foobar",
        ...clientCredentials
      }
    };
    instance(req, {}, next);
    expect(next.calledOnce).to.be.true;
    expect(req.hull.clientCredentials).to.eql(clientCredentials);
    expect(decode(req.hull.clientCredentialsToken)).to.eql(clientCredentials);
  });

  it("uses clientCredentialsToken over the query Token", () => {
    const instance = credentialsFromQueryMiddleware();
    const next = sinon.spy();
    const req = {
      hull: {
        connectorConfig,
        clientCredentialsToken
      },
      query: {
        token: "foobaz",
        ...clientCredentials
      }
    };
    instance(req, {}, next);
    expect(next.calledOnce).to.be.true;
    expect(req.hull.clientCredentials).to.eql(clientCredentials);
    expect(decode(req.hull.clientCredentialsToken)).to.eql(clientCredentials);
  });

  it("uses query Token over query Credentials", () => {
    const instance = credentialsFromQueryMiddleware();
    const next = sinon.spy();
    const req = {
      hull: {
        connectorConfig
      },
      query: {
        token: clientCredentialsToken,
        ...clientCredentials
      }
    };
    instance(req, {}, next);
    expect(next.calledOnce).to.be.true;
    expect(req.hull.clientCredentials).to.eql(clientCredentials);
    expect(decode(req.hull.clientCredentialsToken)).to.eql(clientCredentials);
  });

  it("uses query Credentials as fallback", () => {
    const instance = credentialsFromQueryMiddleware();
    const next = sinon.spy();
    const req = {
      hull: {
        connectorConfig
      },
      query: clientCredentials
    };
    instance(req, {}, next);
    expect(next.calledOnce).to.be.true;
    expect(req.hull.clientCredentials).to.eql(clientCredentials);
    expect(decode(req.hull.clientCredentialsToken)).to.eql(clientCredentials);
  });
});
