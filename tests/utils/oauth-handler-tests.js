/* global describe, it */
import http from "http";
import { expect, should } from "chai";
import sinon from "sinon";
import express from "express";
import Promise from "bluebird";
import passport from "passport";
import request from "request";
import { renderFile } from "ejs";

import HullStub from "../support/hull-stub";

import oauthHandler from "../../src/utils/oauth-handler";

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
}

describe("OAuthHandler", () => {
  it("should handle oauth errors", (done) => {
    const handler = sinon.spy();
    const app = express();
    app.engine("html", renderFile);
    app.set("views", `${process.cwd()}/tests/fixtures/`);
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
