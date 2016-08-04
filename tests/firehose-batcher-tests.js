/* global describe, it */

import Batcher from "../src/firehose-batcher";
import Hull from "../src/client";
const { expect, should } = require("chai");

describe("Batch", () => {
  describe("Calling batches", () => {
    const config = {
      id: '57a308a20a034b01790000ad',
      secret: 'shhuuut',
      organization: 'c6580820.hullbeta.dev',
      flushAt: 5,
      flushAfter: 100
    };

    it("should batch", (done) => {

      let handleCount = 0;

      const handler = ({ batch }, batcher) => {
        handleCount += 1;
        expect(batcher.config.get("secret")).to.eq(config.secret);
        if (handleCount == 1) {
          expect(batch.length).to.eq(5);
          expect(batch[0].headers['Hull-Access-Token']).to.eq("123");
          expect(batch[4].headers['Hull-Access-Token']).to.eq("456");
        } else if (handleCount == 2) {
          expect(batch.length).to.eq(2);
          expect(batch[0].headers['Hull-Access-Token']).to.eq("456");
          done();
        }
      }

      const batch1 = Batcher.getInstance({ ...config, accessToken: "123" }, handler);
      const batch2 = Batcher.getInstance({ ...config, accessToken: "456" }, handler);

      batch1({ type: 'track', body: { event: 'yeah', properties: { foo: 'bat', num: 1 } } });
      batch1({ type: 'track', body: { event: 'yeah', properties: { foo: 'bat', num: 2 } } });
      batch1({ type: 'track', body: { event: 'yeah', properties: { foo: 'bat', num: 3 } } });
      batch2({ type: 'track', body: { event: 'yeah', properties: { foo: 'bat', num: 4 } } });
      batch2({ type: 'track', body: { event: 'yeah', properties: { foo: 'bat', num: 5 } } });
      batch2({ type: 'track', body: { event: 'yeah', properties: { foo: 'bat', num: 6 } } });
      batch2({ type: 'track', body: { event: 'yeah', properties: { foo: 'bat', num: 7 } } });

    });
  });
});
