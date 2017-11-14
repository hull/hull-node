/* global describe, it */
const http = require("http");
const { expect, should } = require("chai");
const sinon = require("sinon");
const express = require("express");
const Promise = require("bluebird");
const passport = require("passport");
const request = require("request");
const { renderFile } = require("ejs");

const HullStub = require("../support/hull-stub");

const oauthHandler = require("../../../src/utils/oauth-handler");

class StrategyStub extends passport.Strategy {
  constructor() {
    super();
    this.name = "test";
  }
  authenticate(req) {
    throw new Error("test");
  }
}

function mockHullMiddleware(req, res, next) {
  req.hull = req.hull || {};
  req.hull.client = new HullStub();
  req.hull.client.get()
    .then(ship => {
      req.hull.ship = ship;
      next();
    });
  req.hull.metric = {
    error: () => {}
  };
}

describe("OAuthHandler", () => {
  it("should handle oauth errors", (done) => {
    const app = express();
    app.engine("html", renderFile);
    app.set("views", `${process.cwd()}/test/unit/fixtures/`);
    app.set("view engine", "ejs");

    app.use(mockHullMiddleware);
    app.use("/auth", oauthHandler({
      name: "Test",
      Strategy: StrategyStub,
      views: {
        failure: "oauth-failure-view.html"
      }
    }));
    const server = app.listen(() => {
      const port = server.address().port;
      request(`http://localhost:${port}/auth/callback`, (error, response, body) => {
          expect(response.statusCode).to.equal(200);
          expect(body).to.equal("This is an oauth failure: test\n");
          done();
        });
    });
  });
});
