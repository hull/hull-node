/* @flow */
import type { $Request } from "express";

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

  validateHeaders(req: $Request): Error | null {
    if (!this.hasFlagHeader(req)) {
      return new Error("UNSUPPORTED_SIGNATURE_VERSION", "Unsupported signature version");
    }

    if (!this.validateSignatureVersion(req)) {
      return new Error("UNSUPPORTED_SIGNATURE_VERSION", "Unsupported signature version");
    }

    if (!this.validateSignatureHeaders(req)) {
      return new Error("MISSING_SIGNATURE_HEADERS", "Missing signature header(s)");
    }

    return null;
  }

  hasFlagHeader(req: $Request): boolean {
    return _.has(req.headers, "x-hull-smart-notifier");
  }

  validatePayload(req: $Request): Error | null {
    if (!req.body) {
      return new Error("MISSING_NOTIFICATION", "No notification in payload");
    }

    if (!req.body.configuration) {
      return new Error("MISSING_CONFIGURATION", "No configuration in payload");
    }
    return null;
  }

  validateSignatureVersion(req: $Request): boolean {
    return _.has(req.headers, "x-hull-smart-notifier-signature-version") &&
      _.indexOf(supportedSignaturesVersions, req.headers["x-hull-smart-notifier-signature-version"]) >= 0;
  }

  validateSignatureHeaders(req: $Request): boolean {
    return ["x-hull-smart-notifier-signature",
      "x-hull-smart-notifier-signature-version",
      "x-hull-smart-notifier-signature-public-key-url"
    ].every(h => _.has(req.headers, h));
  }

  validateSignature(req: $Request): Promise {
    return this.getCertificate(req)
      .then((certificate) => {
        try {
          const decoded = jwt.verify(req.headers["x-hull-smart-notifier-signature"], certificate, {
            algorithms: ["RS256"],
            jwtid: req.body.notification_id
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

  getCertificate(req: $Request): Promise {
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
