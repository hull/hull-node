/* global describe, it */
/* eslint-disable no-unused-expressions */
import { expect } from "chai";
import sinon from "sinon";

import HullStub from "../support/hull-stub";

import requestExtract from "../../../src/helpers/request-extract";

describe("extract.request", () => {
  beforeEach(function beforeEachHandler() {
    this.postStub = sinon.stub(HullStub.prototype, "post");
  });

  afterEach(function afterEachHandler() {
    this.postStub.restore();
  });

  it("should allow to perform `extract/user_reports` call", function test1(done) {
    const stub = new HullStub;
    requestExtract({ client: stub, hostname: "localhost" })
      .then(() => {
        expect(this.postStub.calledOnce).to.be.true;
        expect(this.postStub.calledWith("extract/user_reports", {
          url: `https://localhost/batch?ship=${stub.configuration().id}&secret=shutt&organization=xxx.hulltest.rocks&source=connector`,
          query: {},
          format: "json",
          fields: []
        })).to.be.true;
        done();
      });
  });

  it("should allow to pass additionalQuery", function test1(done) {
    const stub = new HullStub;
    requestExtract({ client: stub, hostname: "localhost" }, { additionalQuery: { foo: "bar" } })
      .then(() => {
        expect(this.postStub.calledOnce).to.be.true;
        expect(this.postStub.calledWith("extract/user_reports", {
          url: `https://localhost/batch?ship=${stub.configuration().id}&secret=shutt&organization=xxx.hulltest.rocks&source=connector&foo=bar`,
          query: {},
          format: "json",
          fields: []
        })).to.be.true;
        done();
      });
  });
});
