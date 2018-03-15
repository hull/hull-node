/* global describe,it */
const { expect } = require("chai");

const Hull = require("../../src");

describe("Hull", () => {
  it("should expose full public interface", () => {
    expect(Hull).to.be.a("Function");
    expect(Hull.Client).to.be.a("Function");
    expect(Hull.Client === Hull).to.be.true; // eslint-disable-line
    expect(Hull.Middleware).to.be.a("Function");
    expect(Hull.Connector).to.be.a("Function");
  });
});
