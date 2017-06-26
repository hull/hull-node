import { expect } from "chai";
import Hull from "../src";

import Minihull from "minihull";

describe("track", function test() {
  let client;
  let minihull;
  this.timeout(10000);
  beforeEach(() => {
    minihull = new Minihull();
    minihull.listen(8000);
    client = new Hull({
      organization: "localhost:8000",
      firehoseUrl: "http://localhost:8000/boom/firehose",
      id: "111111111111111111111111",
      secret: "rocks",
      protocol: "http",
      flushAfter: 100
    });
    process.env.BATCH_TIMEOUT = 300;
    process.env.BATCH_RETRY = 10;
  });

  afterEach(() => {
    minihull.close();
    delete process.env.BATCH_TIMEOUT;
    delete process.env.BATCH_RETRY;
  });

  it("should set default event_id", (done) => {
    client.asUser("123").track("Foo")
      .then(() => {
        const firstReq = minihull.requests.get("incoming").get(0).value();
        expect(firstReq.body.batch[0].body.event_id).to.not.be.empty;
        done();
      });
  });

  it("should not overwrite event_id if provided", (done) => {
    client.asUser("123").track("Foo", {}, { event_id: "someCustomValue" })
      .then(() => {
        const firstReq = minihull.requests.get("incoming").get(0).value();
        expect(firstReq.body.batch[0].body.event_id).to.equal("someCustomValue");
        done();
      });
  });

  it("shoud retry with the same event_id", (done) => {
    const stub = minihull.stubPost("/boom/firehose")
      .onFirstCall()
      .callsFake((req, res) => {})
      .onSecondCall()
      .callsFake((req, res) => res.end("ok"));

    client.asUser("123").track("Foo")
      .then(() => {
        expect(stub.callCount).to.be.eql(2);
        const firstReq = minihull.requests.get("incoming").get(0).value();
        const secondReq = minihull.requests.get("incoming").get(1).value();
        expect(firstReq.body.batch[0].body.event_id).to.be.equal(secondReq.body.batch[0].body.event_id);
        done();
      });
  });
});
