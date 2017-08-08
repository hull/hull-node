// @flow
import { Request } from "express";
import Promise from "bluebird";
import requestClient from "request";
import _ from "lodash";
import jwt from "jsonwebtoken";

const certCache = {};

export default class SmartNotifierValidator {
  request: Request;
  error: String;

  setRequest(request: Request) {
    this.request = request;
    return this;
  }

  getError() {
    return this.error;
  }

  hasFlagHeader() {
    return _.has(this.request.headers, "x-hull-smart-notifier");
  }

  validatePayload() {
    if (!this.request.body) {
      return false;
    }
    return true;
  }

  validateConfiguration() {
    if (!this.request.body.configuration) {
      return false;
    }
    return true;
  }

  validateSignature() {
    return this.getCertificate()
      .then((certificate) => {
        try {
          const decoded = jwt.verify(this.request.headers["x-hull-smart-notifier-signature"], certificate);
          if (decoded) {
            return Promise.resolve(true);
          }
          return Promise.reject(new Error("Signature invalid"));
        } catch (err) {
          return Promise.reject(new Error("Signature invalid"));
        }
      });
  }

  getCertificate() {
    const certUrl = this.request.headers["x-hull-smart-notifier-signature-public-key-url"];
    const signature = this.request.headers["x-hull-smart-notifier-signature"];
    if (_.has(certCache, certUrl)) {
      return Promise.resolve(_.get(certCache, certUrl));
    }
    return new Promise((resolve, reject) => {
      requestClient.post(certUrl, { form: signature }, (error, response, body) => {
        if (error) {
          return reject(error);
        }
        certCache[certUrl] = body;
        return resolve(body);
      });
    });
  }
}
