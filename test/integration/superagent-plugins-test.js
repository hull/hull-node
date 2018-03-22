/* global it, describe */
const nock = require("nock");
const superagent = require("superagent");
const TransientError = require("../../src/errors/transient-error");
const ConfigurationError = require("../../src/errors/configuration-error");

const superagentErrorPlugin = require("../../src/utils/superagent-error-plugin");

describe("SuperAgent plugins", () => {
  describe("error plugin", () => {
    it("should return transient error for ECONNRESET", (done) => {
      nock("http://test")
        .get("/test")
        .thrice()
        .replyWithError({ code: "ECONNRESET" });
      superagent.get("http://test/test")
        .use(superagentErrorPlugin())
        .then(() => {})
        .catch((error) => {
          console.log(error.stack, error instanceof TransientError);
          done();
        });
    });

    it("should return transient error for a header response timeout", (done) => {
      nock("http://test")
        .get("/test")
        .thrice()
        .delay({ head: 2000 })
        .reply(200);
      superagent.get("http://test/test")
        .use(superagentErrorPlugin())
        .timeout({
          response: 10
        })
        .then((res) => {
          console.log(res);
        })
        .catch((error) => {
          console.log(error, error instanceof TransientError);
          done();
        });
    });

    it("should return transient error for EADDRINFO", (done) => {
      nock("http://test")
        .get("/test")
        .thrice()
        .replyWithError({ code: "EADDRINFO" });
      superagent.get("http://test/test")
        .use(superagentErrorPlugin())
        .then((res) => {
          console.log(res);
        })
        .catch((error) => {
          console.log(error, error instanceof TransientError);
          done();
        });
    });

    it("should return transient error for body timeout", (done) => {
      nock("http://test")
        .get("/test")
        .thrice()
        .delay({ body: 1000 })
        .reply(200, "body");

      superagent.get("http://test/test")
        .use(superagentErrorPlugin())
        .timeout({
          deadline: 10
        })
        .then((res) => {
          console.log(res);
        })
        .catch((error) => {
          console.log(error, error instanceof TransientError);
          done();
        });
    });

    it("should reject with normal Error object in case of non 2xx response", (done) => {
      nock("http://test")
        .get("/test")
        .reply(401, "Not authorized");

      superagent.get("http://test/test")
        .use(superagentErrorPlugin())
        .then((res) => {
          console.log(res);
        })
        .catch((error) => {
          console.log(error, error instanceof Error);
          done();
        });
    });

    it("should allow to override ok handler to pass custom errors", (done) => {
      nock("http://test")
        .get("/test")
        .reply(401, "Not authorized");

      superagent.get("http://test/test")
        .use(superagentErrorPlugin())
        .ok((res) => {
          if (res.status === 401) {
            throw new ConfigurationError();
          }
          return true;
        })
        .then((res) => {
          console.log(res);
        })
        .catch((error) => {
          console.log(error, error instanceof ConfigurationError, error.constructor.name);
          done();
        });
    });

    it("should allow normal response without retrial", (done) => {
      nock("http://test")
        .get("/test")
        .reply(200, "OK");

      superagent.get("http://test/test")
        .use(superagentErrorPlugin())
        .then((res) => {
          console.log(res);
          done();
        })
        .catch((error) => {
        });
    });
  });
});
