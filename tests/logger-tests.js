/* global describe, it */
import { expect } from "chai";
import sinon from "sinon";
import jwt from "jwt-simple";

import Hull from "../src";

describe("Hull Logger", () => {
  let originalWrite, result;
  beforeEach(() => {
    originalWrite = process.stdout.write;
    result = "";
    process.stdout.write = (log) => {
      result = log;
    };
  });

  it("should by default print id and organization context", () => {
    const hull = new Hull({ id: "562123b470df84b740000042", secret: "1234", organization: "test" });
    hull.logger.info("test", { foo: "bar" });
    process.stdout.write = originalWrite;
    expect(JSON.parse(result)).to.be.eql({
      context: {
        id: "562123b470df84b740000042",
        organization: "test"
      },
      level: "info",
      message: "test",
      data: {
        foo: "bar"
      }
    });

  });

  it("should allow passing connectorName to the context and results in connector_name in logs", () => {
    const hull = new Hull({ id: "562123b470df84b740000042", secret: "1234", organization: "test", connectorName: "testing" });
    hull.logger.info("test", { foo: "bar" });
    process.stdout.write = originalWrite;
    expect(JSON.parse(result)).to.be.eql({
      context: {
        id: "562123b470df84b740000042",
        organization: "test",
        connector_name: "testing"
      },
      level: "info",
      message: "test",
      data: {
        foo: "bar"
      }
    });
  });
});
