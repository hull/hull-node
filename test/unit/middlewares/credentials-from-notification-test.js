/* global describe, it */
const { expect } = require("chai");
const sinon = require("sinon");

const credentialsFromNotificationMiddleware = require("../../../src/middlewares/credentials-from-notification");
const HullStub = require("../support/hull-stub");
const connectorId = "5b606edcb1deeba01f0000d1";

const clientCredentials = {
  organization: "local",
  secret: "secret",
  id: connectorId
};
const hullRequest = {
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

describe("credentialsFromNotificationMiddlewareTest", () => {
  it("checks for the presence of x-hull-smart-notifier", () => {
    const instance = credentialsFromNotificationMiddleware();
    const next = sinon.spy();
    instance(hullRequest, {}, next);
    expect(next.calledOnce).to.be.true;
    expect(next.args[0][0]).to.be.an("error");
    expect(next.args[0][0].message).to.eql(
      "Missing x-hull-smart-notifier header"
    );
  });

  it("checks for the presence of x-hull-smart-notifier-signature-version", () => {
    const instance = credentialsFromNotificationMiddleware();
    const next = sinon.spy();
    instance(
      {
        ...hullRequest,
        headers: {
          "x-hull-smart-notifier": "foo"
        }
      },
      {},
      next
    );
    expect(next.calledOnce).to.be.true;
    expect(next.args[0][0]).to.be.an("error");
    expect(next.args[0][0].message).to.eql(
      "Unsupported x-hull-smart-notifier-signature-version header"
    );
  });

  it("checks for the validity of x-hull-smart-notifier-signature-version", () => {
    const instance = credentialsFromNotificationMiddleware();
    const next = sinon.spy();
    instance(
      {
        ...hullRequest,
        headers: {
          "x-hull-smart-notifier": "foo",
          "x-hull-smart-notifier-signature-version": "foo"
        }
      },
      {},
      next
    );
    expect(next.calledOnce).to.be.true;
    expect(next.args[0][0]).to.be.an("error");
    expect(next.args[0][0].message).to.eql(
      "Unsupported x-hull-smart-notifier-signature-version header"
    );
  });

  it("checks for the presence of x-hull-smart-notifier-signature-headers", () => {
    const instance = credentialsFromNotificationMiddleware();
    const next = sinon.spy();
    instance(
      {
        ...hullRequest,
        headers: {
          "x-hull-smart-notifier": "foo",
          "x-hull-smart-notifier-signature-version": "v1"
        }
      },
      {},
      next
    );
    expect(next.calledOnce).to.be.true;
    expect(next.args[0][0]).to.be.an("error");
    expect(next.args[0][0].message).to.eql(
      "Missing x-hull-smart-notifier-signature header(s)"
    );
  });
});
