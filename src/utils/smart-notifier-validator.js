/* @flow */
const Promise = require("bluebird");
const superagent = require("superagent");
const _ = require("lodash");
const jwt = require("jsonwebtoken");

const certCache = {};
const supportedSignaturesVersions = ["v1"];

module.exports = class SmartNotifierValidator {
  request: Object;

  httpClient: superagent;

  constructor(http: superagent = null) {
    if (!http) {
      this.httpClient = superagent;
    } else {
      this.httpClient = http;
    }
  }

  setRequest(request: Object) {
    this.request = request;
    return this;
  }

  hasFlagHeader(): boolean {
    return _.has(this.request.headers, "x-hull-smart-notifier");
  }

  validatePayload(): boolean {
    if (!this.request.body) {
      return false;
    }
    return true;
  }

  validateSignatureVersion(): boolean {
    return _.has(this.request.headers, "x-hull-smart-notifier-signature-version")
      && _.indexOf(supportedSignaturesVersions, this.request.headers["x-hull-smart-notifier-signature-version"]) >= 0;
  }

  validateSignatureHeaders(): boolean {
    return ["x-hull-smart-notifier-signature",
      "x-hull-smart-notifier-signature-version",
      "x-hull-smart-notifier-signature-public-key-url"
    ].every((h) => _.has(this.request.headers, h));
  }

  validateConfiguration(): boolean {
    if (!this.request.body.configuration) {
      return false;
    }
    return true;
  }

  validateSignature(): Promise {
    return this.getCertificate()
      .then((certificate) => {
        try {
          const decoded = jwt.verify(this.request.headers["x-hull-smart-notifier-signature"], certificate, {
            algorithms: ["RS256"],
            jwtid: this.request.body.notification_id
          });

          if (decoded) {
            return Promise.resolve(true);
          }
          return Promise.reject(new Error("Signature invalid"));
        } catch (err) {
          return Promise.reject(err);
        }
      });
  }

  getCertificate(): Promise {
    const certUrl = this.request.headers["x-hull-smart-notifier-signature-public-key-url"];
    const signature = this.request.headers["x-hull-smart-notifier-signature"];
    if (_.has(certCache, certUrl)) {
      return Promise.resolve(_.get(certCache, certUrl));
    }
    return new Promise((resolve, reject) => {
      this.httpClient.post(certUrl, {
        body: signature
      }, (error, response) => {
        if (error) {
          return reject(error);
        }
        const { text = "" } = response;
        if (!text.match("-----BEGIN PUBLIC KEY-----")) {
          return reject(new Error("Invalid certificate"));
        }
        certCache[certUrl] = text;
        return resolve(text);
      });
    });
  }
};
