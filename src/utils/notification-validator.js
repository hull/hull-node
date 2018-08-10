/* @flow */
// import type { $Request } from "express";
import type { HullRequestBase } from "../types";

const Promise = require("bluebird");
const requestClient = require("request");
const _ = require("lodash");
const jwt = require("jsonwebtoken");

const { NotificationValidationError } = require("../errors");

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

  validateHeaders(req: HullRequestBase): NotificationValidationError | null {
    if (!this.hasFlagHeader(req)) {
      return new NotificationValidationError(
        "Missing flag header",
        "MISSING_FLAG_HEADER"
      );
    }

    if (!this.validateSignatureVersion(req)) {
      return new NotificationValidationError(
        "Unsupported signature version",
        "UNSUPPORTED_SIGNATURE_VERSION"
      );
    }

    if (!this.validateSignatureHeaders(req)) {
      return new NotificationValidationError(
        "Missing signature header(s)",
        "MISSING_SIGNATURE_HEADERS"
      );
    }

    return null;
  }

  hasFlagHeader(req: HullRequestBase): boolean {
    return _.has(req.headers, "x-hull-smart-notifier");
  }

  validatePayload(req: HullRequestBase): NotificationValidationError | null {
    if (!req.body) {
      return new NotificationValidationError(
        "No notification payload",
        "MISSING_NOTIFICATION_PAYLOAD"
      );
    }

    if (!req.body.configuration) {
      return new NotificationValidationError(
        "No configuration in payload",
        "MISSING_CONFIGURATION"
      );
    }
    return null;
  }

  validateSignatureVersion(req: HullRequestBase): boolean {
    return (
      _.has(req.headers, "x-hull-smart-notifier-signature-version") &&
      _.indexOf(
        supportedSignaturesVersions,
        req.headers["x-hull-smart-notifier-signature-version"]
      ) >= 0
    );
  }

  validateSignatureHeaders(req: HullRequestBase): boolean {
    return [
      "x-hull-smart-notifier-signature",
      "x-hull-smart-notifier-signature-version",
      "x-hull-smart-notifier-signature-public-key-url",
    ].every(h => _.has(req.headers, h));
  }

  validateSignature(req: HullRequestBase): Promise {
    return this.getCertificate(req).then(certificate => {
      try {
        const decoded = jwt.verify(
          req.headers["x-hull-smart-notifier-signature"],
          certificate,
          {
            algorithms: ["RS256"],
            jwtid: (req.body && req.body.notification_id) || "",
          }
        );

        if (decoded) {
          return Promise.resolve(true);
        }
        return Promise.reject(
          new NotificationValidationError(
            "Signature invalid",
            "INVALID_SIGNATURE"
          )
        );
      } catch (err) {
        return Promise.reject(err);
      }
    });
  }

  getCertificate(req: HullRequestBase): Promise {
    const certUrl =
      req.headers["x-hull-smart-notifier-signature-public-key-url"];
    const signature = req.headers["x-hull-smart-notifier-signature"];
    if (_.has(certCache, certUrl)) {
      return Promise.resolve(_.get(certCache, certUrl));
    }
    return new Promise((resolve, reject) => {
      this.httpClient.post(
        certUrl,
        {
          body: signature,
        },
        (error, response, body) => {
          if (error) {
            return reject(error);
          }
          if (!body.match("-----BEGIN PUBLIC KEY-----")) {
            return reject(
              new NotificationValidationError(
                "Invalid certificate",
                "INVALID_CERTIFICATE"
              )
            );
          }
          certCache[certUrl] = body;
          return resolve(body);
        }
      );
    });
  }
}

module.exports = NotificationValidator;
