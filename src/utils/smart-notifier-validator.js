// @flow
import {
  Request
} from "express";
import Promise from "bluebird";
import requestClient from "request";
import _ from "lodash";
import jwt from "jsonwebtoken";

const certCache = {};
const supportedSignaturesVersions = ["v1"];

export default class SmartNotifierValidator {
  request: Request;
  httpClient: requestClient;

  constructor(http: requestClient = null) {
    if (!http) {
      this.httpClient = requestClient;
    } else {
      this.httpClient = http;
    }
  }

  setRequest(request: Request) {
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
    return _.has(this.request.headers, "x-hull-smart-notifier-signature-version") &&
      _.indexOf(supportedSignaturesVersions, this.request.headers["x-hull-smart-notifier-signature-version"]) >= 0;
  }

  validateSignatureHeaders(): boolean {
    return ["x-hull-smart-notifier-signature",
      "x-hull-smart-notifier-signature-version",
      "x-hull-smart-notifier-signature-public-key-url"
    ].every(h => _.has(this.request.headers, h));
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
