/* global describe, it */
/* eslint-disable no-unused-expressions */
const { expect } = require("chai");
const Hull = require("../../src");
const express = require("express");
const { notifHandler } = require("../../src/utils");
const request = require("request");

const userReport = require("../unit/fixtures/sns-messages/user-report.json");

describe("segmentFiltering", () => {
  it("should mark user not filtered in notification when he doesn't belong to any filtered segment", (done) => {
    const mockHull = express();
    mockHull.get("/api/v1/562123b470df84b740000042", (req, res) => {
      res.json({
        private_settings: {
          filtered_segments: ["abc"]
        }
      });
    });
    const server1 = mockHull.listen("8071");


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
          server1.close();
          server2.close();
          done();
        }
      }
    }))

    const server2 = connector.startApp(app);

    request({
      uri: "http://localhost:8070/notif?ship=562123b470df84b740000042&organization=localhost:8071&secret=1234",
      headers: {
        "x-amz-sns-message-type": true
      },
      method: "post",
      json: true,
      body: userReport
    });
  });

  it("should mark user as filtered in notification when he belongs to any filtered segment", (done) => {
    const mockHull = express();
    mockHull.get("/api/v1/562123b470df84b740000042", (req, res) => {
      res.json({
        private_settings: {
          filtered_segments: ["579677ff03777d1769000042"]
        }
      });
    });
    const server1 = mockHull.listen("8071");


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
          // console.log(messages);
          expect(messages[0].matchesFilter).to.be.true;
          server1.close();
          server2.close();
          done();
        }
      }
    }))

    const server2 = connector.startApp(app);

    request({
      uri: "http://localhost:8070/notif?ship=562123b470df84b740000042&organization=localhost:8071&secret=1234",
      headers: {
        "x-amz-sns-message-type": true
      },
      method: "post",
      json: true,
      body: userReport
    });
  });

  it("should mark user as filtered in notification when the setting doesn't exists", (done) => {
    const mockHull = express();
    mockHull.get("/api/v1/562123b470df84b740000042", (req, res) => {
      res.json({
        private_settings: {
          filtered_segments: ["abc"]
        }
      });
    });
    const server1 = mockHull.listen("8071");


    const app = express();
    const connector = new Hull.Connector({
      port: 8070,
      hostSecret: "1234",
      segmentFilterSetting: "foo_bar",
      clientConfig: {
        protocol: "http"
      }
    });

    connector.setupApp(app);

    app.use("/notif", notifHandler({
      handlers: {
        "user:update" : function(ctx, messages = []) {
          expect(messages[0].matchesFilter).to.be.true;
          server1.close();
          server2.close();
          done();
        }
      }
    }))

    const server2 = connector.startApp(app);

    request({
      uri: "http://localhost:8070/notif?ship=562123b470df84b740000042&organization=localhost:8071&secret=1234",
      headers: {
        "x-amz-sns-message-type": true
      },
      method: "post",
      json: true,
      body: userReport
    });
  });

  it("should mark user not filtered in notification when the setting exists but it's empty", (done) => {
    const mockHull = express();
    mockHull.get("/api/v1/562123b470df84b740000042", (req, res) => {
      res.json({
        private_settings: {
          filtered_segments: []
        }
      });
    });
    const server1 = mockHull.listen("8071");


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
          server1.close();
          server2.close();
          done();
        }
      }
    }))

    const server2 = connector.startApp(app);

    request({
      uri: "http://localhost:8070/notif?ship=562123b470df84b740000042&organization=localhost:8071&secret=1234",
      headers: {
        "x-amz-sns-message-type": true
      },
      method: "post",
      json: true,
      body: userReport
    });
  });
});
