/* global describe,it */
const { expect } = require("chai");

const Hull = require("../../src");

describe("Hull", () => {
  it("should expose full public interface", () => {
    expect(Hull).to.be.an("Object");
    expect(Hull.Client).to.be.a("Function");
    expect(Hull.start).to.be.a("Function");
    expect(Hull.Connector).to.be.a("Function");
  });
});
