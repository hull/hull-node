/* @flow */
// import type { $Request } from "express";
import type { HullRequestBase } from "../types";

const Promise = require("bluebird");
const requestClient = require("request");
const _ = require("lodash");
const jwt = require("jsonwebtoken");

const certCache = {};
const supportedSignaturesVersions = ["v1"];

class NotificationValidator {
  httpClient: requestClient;

  constructor(httpClient: requestClient = null) {
    if (!httpClient) {
      this.httpClient = requestClient;
    } else {
      this.httpClient = httpClient;
    }
  }

  validateHeaders(req: HullRequestBase): Error | null {
    if (!this.hasFlagHeader(req)) {
      return new Error("Unsupported signature version");
    }

    if (!this.validateSignatureVersion(req)) {
      return new Error("Unsupported signature version");
    }

    if (!this.validateSignatureHeaders(req)) {
      return new Error("Missing signature header(s)");
    }

    return null;
  }

  hasFlagHeader(req: HullRequestBase): boolean {
    return _.has(req.headers, "x-hull-smart-notifier");
  }

  validatePayload(req: HullRequestBase): Error | null {
    if (!req.body) {
      return new Error("No notification in payload");
    }

    if (!req.body.configuration) {
      return new Error("No configuration in payload");
    }
    return null;
  }

  validateSignatureVersion(req: HullRequestBase): boolean {
    return _.has(req.headers, "x-hull-smart-notifier-signature-version") &&
      _.indexOf(supportedSignaturesVersions, req.headers["x-hull-smart-notifier-signature-version"]) >= 0;
  }

  validateSignatureHeaders(req: HullRequestBase): boolean {
    return ["x-hull-smart-notifier-signature",
      "x-hull-smart-notifier-signature-version",
      "x-hull-smart-notifier-signature-public-key-url"
    ].every(h => _.has(req.headers, h));
  }

  validateSignature(req: HullRequestBase): Promise {
    return this.getCertificate(req)
      .then((certificate) => {
        try {
          const decoded = jwt.verify(req.headers["x-hull-smart-notifier-signature"], certificate, {
            algorithms: ["RS256"],
            jwtid: (req.body && req.body.notification_id) || ""
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

  getCertificate(req: HullRequestBase): Promise {
    const certUrl = req.headers["x-hull-smart-notifier-signature-public-key-url"];
    const signature = req.headers["x-hull-smart-notifier-signature"];
    if (_.has(certCache, certUrl)) {
      return Promise.resolve(_.get(certCache, certUrl));
    }
    return new Promise((resolve, reject) => {
      this.httpClient.post(certUrl, {
        body: signature
      }, (error, response, body) => {
        if (error) {
          return reject(error);
        }
        if (!body.match("-----BEGIN PUBLIC KEY-----")) {
          return reject(new Error("Invalid certificate"));
        }
        certCache[certUrl] = body;
        return resolve(body);
      });
    });
  }
}

module.exports = NotificationValidator;
