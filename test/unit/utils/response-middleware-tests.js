/* global describe, it */
const { expect, should } = require("chai");
const sinon = require("sinon");

const responseMiddleware = require("../../../src/utils/response-middleware");

const resMock = {
  status: () => {},
  end: () => {},
}

describe("responseMiddleware", () => {
  it("should respond 200 ok for empty result", () => {
    [null, undefined, 0].map(result => {
      const mock = sinon.mock(resMock)
      mock.expects("status").once().withArgs(200);
      mock.expects("end").once().withArgs("ok");

      const instance = responseMiddleware();
      instance(result, {}, resMock, () => {});
      mock.verify();
    });
  });

  it("should respond 200 and string for body", () => {
    ["some message", ""].map(result => {
      const mock = sinon.mock(resMock)
      mock.expects("status").once().withArgs(200);
      mock.expects("end").once().withArgs(result);

      const instance = responseMiddleware();
      instance(result, {}, resMock, () => {});
      mock.verify();
    });
  });

  it("should respond with 500 and error message", () => {
    const mock = sinon.mock(resMock)
    mock.expects("status").once().withArgs(500);
    mock.expects("end").once().withArgs("some message");

    const instance = responseMiddleware();
    instance(new Error("some message"), {}, resMock, () => {});

    mock.verify();
  });
});
