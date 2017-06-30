/* global it, describe */

import { expect } from "chai";
import Hull from "../src";

import Minihull from "minihull";

describe("client retrying", function test() {
  let minihull,
    client;
  beforeEach(() => {
    minihull = new Minihull();
    minihull.listen(8000);
    client = new Hull({
      organization: "localhost:8000",
      id: "111111111111111111111111",
      secret: "rocks",
      protocol: "http"
    });
  });

  afterEach(() => {
    minihull.close();
  });

  it("should retry 2 times if get 503 response, then reject", (done) => {
    const stub = minihull.stubGet("/api/v1/testing")
      .callsFake((req, res) => {
        res.status(503).end("error 503");
      });

    client.get("/testing")
      .catch((err) => {
        expect(stub.callCount).to.be.eql(3);
        done();
      });
  });

  it("should retry first 503 response, then resolve", (done) => {
    const stub = minihull.stubGet("/api/v1/testing")
      .onFirstCall()
      .callsFake((req, res) => {
        res.status(503).end("error 503");
      })
      .onSecondCall()
      .callsFake((req, res) => {
        res.end("ok");
      });

    client.get("/testing")
      .then(() => {
        expect(stub.callCount).to.be.eql(2);
        minihull.close();
        done();
      });
  });

  it("shoud retry 2 times on timeout, then reject", (done) => {
    const stub = minihull.stubGet("/api/v1/testing")
      .callsFake((req, res) => {});

    client.get("/testing", {}, { timeout: 20, retry: 10 })
      .catch((err) => {
        expect(stub.callCount).to.be.eql(3);
        done();
      });
  });

  it("shoud retry first timeout, then resolve", (done) => {
    const stub = minihull.stubGet("/api/v1/testing")
      .onFirstCall()
      .callsFake((req, res) => {
      })
      .onSecondCall()
      .callsFake((req, res) => {
        res.end("ok");
      });

    client.get("/testing", {}, { timeout: 20, retry: 10 })
      .then(() => {
        expect(stub.callCount).to.be.eql(2);
        done();
      });
  });
});
