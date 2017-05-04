/* global describe, it */
/* eslint-disable no-unused-expressions */
import { expect } from "chai";
import Hull from "../src";
import express from "express";
import { notifHandler } from "../src/utils";
import request from "request";

import userReport from "../tests/fixtures/sns-messages/user-report.json";

describe("segmentFiltering", () => {

  it("should allow to setup the filtering setting", (done) => {
    const mockHull = express();
    mockHull.get("/api/v1/562123b470df84b740000042", (req, res) => {
      res.json({
        private_settings: {
          filtered_segments: ["abc"]
        }
      });
    });
    mockHull.listen("8071");


    const app = express();
    const connector = new Hull.Connector({
      port: 8070,
      hostSecret: "1234",
      segmentFilterSetting: "filtered_segments",
      clientConfig: {
        protocol: "http"
      }
    });

    connector.setupApp(app);

    app.use("/notif", notifHandler({
      handlers: {
        "user:update" : function(ctx, messages = []) {
          expect(messages[0].matchesFilter).to.be.false;
          done();
        }
      }
    }))

    connector.startApp(app);

    request({
      uri: "http://localhost:8070/notif?ship=562123b470df84b740000042&organization=localhost:8071&secret=1234",
      method: "post",
      json: true,
      body: userReport
    });
  });
});
