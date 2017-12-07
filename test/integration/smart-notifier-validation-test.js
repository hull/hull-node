/* global describe, it */
const {
  expect,
  should
} = require("chai");
const sinon = require("sinon");
const express = require("express");
const Promise = require("bluebird");

const smartNotifierHandler = require("../../src/utils/smart-notifier-handler");
const smartNotifierMiddleware = require("../../src/utils/smart-notifier-middleware");
const smartNotifierErrorMiddleware = require("../../src/utils/smart-notifier-error-middleware");
const requestClient = require("request");

const chai = require('chai');
const chaiHttp = require('chai-http');

chai.use(chaiHttp);
const app = express();
const handler = sinon.spy();
const valid_notification = {
  notification_id: '0123456789',
  channel: 'user:update',
  configuration: {},
  messages: []
};

let mockHttpClient = {};
app.use(smartNotifierMiddleware({
  skipSignatureValidation: false,
  httpClient: mockHttpClient
}));
app.use("/notify", smartNotifierHandler({
  handlers: {
    "user:update": handler
  }
}));
app.use(smartNotifierErrorMiddleware());

const server = app.listen();

describe("SmartNotifierHandler validation", () => {

  // disabled for now due to current architecture which requires us to have
  // both SNS notif middleware and smart-notifier handler applied to application
  // and we need to be able to suport both formats
  // it("should fail with missing smart notifier header", (done) => {
  //   chai.request(server)
  //     .post('/notify')
  //     .send(valid_notification)
  //     // missing header: X-Hull-Smart-Notifier', 'true'
  //     .set('X-Hull-Smart-Notifier-Signature', 'jwt_secret')
  //     .set('X-Hull-Smart-Notifier-Signature-Version', 'v1')
  //     .set('X-Hull-Smart-Notifier-Signature-Public-Key-Url', 'none')
  //     .end((err, res) => {
  //       expect(res.status).to.equal(400);
  //       expect(res.headers['content-type']).to.have.string('application/json');
  //       expect(res.body.errors).to.be.an('array');
  //       expect(res.body.errors).to.be.not.empty;
  //       expect(res.body.errors).to.have.lengthOf(1);
  //       expect(res.body.errors[0].code).to.be.equal('MISSING_FLAG_HEADER');
  //       done();
  //     });
  // });

  it("should fail with unknown signature version", (done) => {
    chai.request(server)
      .post('/notify')
      .send(valid_notification)
      .set('X-Hull-Smart-Notifier', 'true')
      .set('X-Hull-Smart-Notifier-Signature', 'jwt_secret')
      .set('X-Hull-Smart-Notifier-Signature-Version', 'unknown_version')
      .set('X-Hull-Smart-Notifier-Signature-Public-Key-Url', 'none')
      .end((err, res) => {
        expect(res.status).to.equal(400);
        expect(res.headers['content-type']).to.have.string('application/json');
        expect(res.body.errors).to.be.an('array');
        expect(res.body.errors).to.be.not.empty;
        expect(res.body.errors).to.have.lengthOf(1);
        expect(res.body.errors[0].code).to.be.equal('UNSUPPORTED_SIGNATURE_VERSION');
        done();
      });
  });

  it("should cache the platform certificate", (done) => {
    console.log("TO BE IMPLEMENTED");
    done();
  });


  it("should fail with missing signature headers", (done) => {
    chai.request(server)
      .post('/notify')
      .send(valid_notification)
      .set('X-Hull-Smart-Notifier', 'true')
      .set('X-Hull-Smart-Notifier-Signature-Version', 'v1')
      .end((err, res) => {
        expect(res.status).to.equal(400);
        expect(res.headers['content-type']).to.have.string('application/json');
        expect(res.body.errors).to.be.an('array');
        expect(res.body.errors).to.be.not.empty;
        expect(res.body.errors).to.have.lengthOf(1);
        expect(res.body.errors[0].code).to.be.equal('MISSING_SIGNATURE_HEADERS');
        done();
      });
  });

  it("should fail with missing configuration", (done) => {
    let missing_configuration = {
      notification_id: '0123456789',
      channel: 'user:update',
      messages: []
    };
    chai.request(server)
      .post('/notify')
      .send(missing_configuration)
      .set('X-Hull-Smart-Notifier', 'true')
      .set('X-Hull-Smart-Notifier-Signature', 'incorrect')
      .set('X-Hull-Smart-Notifier-Signature-Version', 'v1')
      .set('X-Hull-Smart-Notifier-Signature-Public-Key-Url', 'none')
      .end((err, res) => {
        expect(res.status).to.equal(400);
        expect(res.headers['content-type']).to.have.string('application/json');
        expect(res.body.errors).to.be.an('array');
        expect(res.body.errors).to.be.not.empty;
        expect(res.body.errors).to.have.lengthOf(1);
        expect(res.body.errors[0].code).to.be.equal('MISSING_CONFIGURATION');
        done();
      });
  });


  it("should fail with invalid signature headers", (done) => {
    mockHttpClient.post = function(url, body, cb) {
      cb(null, {}, "invalid certificate");
    };

    chai.request(server)
      .post('/notify')
      .send(valid_notification)
      .set('X-Hull-Smart-Notifier', 'true')
      .set('X-Hull-Smart-Notifier-Signature', 'incorrect')
      .set('X-Hull-Smart-Notifier-Signature-Version', 'v1')
      .set('X-Hull-Smart-Notifier-Signature-Public-Key-Url', 'http://wwww')
      .end((err, res) => {
        expect(res.status).to.equal(400);
        expect(res.headers['content-type']).to.have.string('application/json');
        expect(res.body.errors).to.be.an('array');
        expect(res.body.errors).to.be.not.empty;
        expect(res.body.errors).to.have.lengthOf(1);
        expect(res.body.errors[0].code).to.be.equal('INVALID_SIGNATURE');
        done();
      });

  });

});
