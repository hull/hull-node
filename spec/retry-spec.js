import { expect } from "chai";
import Hull from "../src";

import Minihull from "minihull";

describe("client retrying", function test() {
  it("should retry 2 times if get 503 response, then reject", (done) => {
    const minihull = new Minihull();
    minihull.stubGet("/api/v1/testing")
      .callsFake((req, res) => {
        res.status(503).end("error 503");
      });
    minihull.listen(8000);

    const client = new Hull({
      organization: "localhost:8000",
      id: "111111111111111111111111",
      secret: "rocks",
      protocol: "http"
    });

    client.get("/testing")
      .catch(err => {
        expect(minihull.stubGet("/api/v1/testing").callCount).to.be.eql(3);
        minihull.close();
        done();
      });
  });

  it("should retry first 503 response, then resolve", (done) => {
    const minihull = new Minihull();
    minihull.stubGet("/api/v1/testing")
      .onFirstCall()
      .callsFake((req, res) => {
        res.status(503).end("error 503");
      })
      .onSecondCall()
      .callsFake((req, res) => {
        res.end("ok")
      });

    minihull.listen(8000);

    const client = new Hull({
      organization: "localhost:8000",
      id: "111111111111111111111111",
      secret: "rocks",
      protocol: "http"
    });

    client.get("/testing")
      .then(() => {
        expect(minihull.stubGet("/api/v1/testing").callCount).to.be.eql(2);
        minihull.close();
        done();
      });
  });

  it("shoud retry 2 times on timeout, then reject", (done) => {
    const minihull = new Minihull();
    minihull.stubGet("/api/v1/testing")
      .callsFake((req, res) => {
      });
    minihull.listen(8000);

    const client = new Hull({
      organization: "localhost:8000",
      id: "111111111111111111111111",
      secret: "rocks",
      protocol: "http"
    });

    client.get("/testing", {}, { timeout: 20, retry: 10 })
      .catch(err => {
        expect(minihull.stubGet("/api/v1/testing").callCount).to.be.eql(3);
        minihull.close();
        done();
      });
  });

  it("shoud retry first timeout, then resolve", (done) => {
    const minihull = new Minihull();
    minihull.stubGet("/api/v1/testing")
      .onFirstCall()
      .callsFake((req, res) => {
      })
      .onSecondCall()
      .callsFake((req, res) => {
        res.end("ok")
      });
    minihull.listen(8000);

    const client = new Hull({
      organization: "localhost:8000",
      id: "111111111111111111111111",
      secret: "rocks",
      protocol: "http"
    });

    client.get("/testing", {}, { timeout: 20, retry: 10 })
      .then(() => {
        expect(minihull.stubGet("/api/v1/testing").callCount).to.be.eql(2);
        minihull.close();
        done();
      });
  });


});
