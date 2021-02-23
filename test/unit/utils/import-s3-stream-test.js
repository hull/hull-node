const sinon = require("sinon");
const { expect } = require("chai");
const { Readable } = require("stream");
const ImportS3Stream = require("../../../src/utils/import-s3-stream");
const _ = require("lodash");
const debug = require("debug");

function inspectReadableStream(stream) {
  const events = ["data", "end", "close", "error", "readable"];
  events.forEach((event) => {
    stream.on(event, () => {
      debug("inspect-stream:readable")(`on.${event} %o`, _.omit(stream._readableState, "pipes", "objectMode", "highWaterMark", "defaultEncoding"));
    });
  });
}

function inspectWritableStream(stream) {
  const events = ["close", "drain", "error", "finish"];
  events.forEach((event) => {
    stream.on(event, () => {
      debug("inspect-stream:writable")(`on.${event} %o`, _.omit(stream._writableState, "pipes", "objectMode", "highWaterMark", "defaultEncoding"));
    });
  });
}

class SourceStream extends Readable {
  constructor(options = {}) {
    options.objectMode = true;
    super(options);
    this._max = options.max || 5;
    this._object = options.object || { foo: "bar" }
    this._delay = options.delay || 0;
    this._errorAt = options.errorAt || null;
    this._index = 0;
  }

  _read() {
    const i = this._index++;
    if (i >= this._max) {
      this.push(null);
    } else {
      setTimeout(() => {
        if (this._errorAt !== null && this._index === this._errorAt) {
          // this.emit("error", new Error("Failed reading"));
          this.destroy(new Error("Failed reading"));
        } else {
          this.push(this._object);
        }
      }, this._delay);
    }
  }
}

function getHullClientStub({ error = false } = {}) {
  return {
    post: (url, params) => {
      if (error !== false) {
        return Promise.reject(error);
      }
      return Promise.resolve(params);
    }
  };
}

function getS3Stub({ delay = 0, errorAt = null } = {}) {
  let index = 0;
  return {
    getSignedUrl: () => {
      return "foo://bar?signedUrl"
    },
    upload: (options) => {
      const { Body } = options;
      let rejectNewPromise;
      const newPromise = new Promise((resolve, reject) => {
        rejectNewPromise = (error) => {
          reject(error);
        };
        Body
          .on("end", () => {
            console.log("on end!!!!");
            setTimeout(() => {
              console.log("--- resolvin'")
              resolve({ Location: `dummy-s3://${options.Bucket}/${options.Key}` });
            }, delay);
          });
        Body
          .on("readable", () => {
            // let chunk;
            // while (null !== (chunk = Body.read(14))) {
            //   if (errorAt && errorAt === index) {
            //     Body.destroy(new Error("Failed writing"));
            //     break;
            //   }
            //   index += 1;
            // }

            // ---

            const chunk = Body.read(14);
            if (errorAt && errorAt === index) {
              return Body.destroy(new Error("Failed writing"));
            }
            index += 1;
            Body.read(0);
          });
      });
      return {
        promise: () => {
          return newPromise
        },
        abort: () => {
          rejectNewPromise(new Error("Request aborted by user"));
        }
      };
    }
  };
}

describe.only("ImportS3Stream", () => {
  it("should handle basic usage", (done) => {
    const hullClient = getHullClientStub();
    const s3 = getS3Stub();
    const importS3Stream = new ImportS3Stream({
      hullClient,
      s3
    }, {
      s3Bucket: "example",
      partSize: 3
    });

    const exampleStream = new SourceStream();
    inspectReadableStream(exampleStream);
    exampleStream.pipe(importS3Stream);

    // inspectWritableStream(importS3Stream);

    importS3Stream.on("finish", () => {
      done();
    });

    importS3Stream.on("error", err => console.log(err));
  });

  it("should handle partSize", (done) => {
    const hullClient = getHullClientStub();
    const s3 = getS3Stub();
    const importS3Stream = new ImportS3Stream({
      hullClient,
      s3
    }, {
      s3Bucket: "example",
      partSize: 10
    });

    const exampleStream = new SourceStream({ max: 40 });
    exampleStream.pipe(importS3Stream);

    importS3Stream.on("finish", () => {
      done();
    });
  });

  it("should handle big payloads", function(done) {
    this.timeout(10000);

    const hullClient = getHullClientStub();
    const s3 = getS3Stub();
    const importS3Stream = new ImportS3Stream({
      hullClient,
      s3
    }, {
      s3Bucket: "example",
      partSize: 1000,
      gzipEnabled: false
    });

    const aBigObject = {
      foo: (new Array(1024)).join(".")
    };
    const exampleStream = new SourceStream({ max: 2000, object: aBigObject });

    exampleStream.pipe(importS3Stream);

    importS3Stream.on("upload-stream-end", () => {
      console.log(process.memoryUsage());
    });

    importS3Stream.on("finish", () => {
      done();
    });
  });

  it("should handle an error on SourceStream", (done) => {
    // when there is an error on source stream
    // the ImportS3Stream will try to process as much as possible and then
    // finish succesfully if there is no other internal error
    const hullClient = getHullClientStub();
    const s3 = getS3Stub();
    const importS3Stream = new ImportS3Stream({
      hullClient,
      s3
    }, {
      s3Bucket: "example",
      partSize: 10
    });

    const exampleStream = new SourceStream({ max: 30, errorAt: 15 });

    exampleStream.pipe(importS3Stream);
    exampleStream.on("error", () => {});
    importS3Stream.on("finish", () => {
      expect(importS3Stream.importResults[0].size).to.equal(10);
      expect(importS3Stream.importResults[1].size).to.equal(5);
      done();
    });
  });

  it("should handle an error on upload stream", (done) => {
    const hullClient = getHullClientStub();
    const s3 = getS3Stub({ errorAt: 15 });
    const importS3Stream = new ImportS3Stream({
      hullClient,
      s3
    }, {
      s3Bucket: "example",
      partSize: 10,
      gzipEnabled: false
    });

    const exampleStream = new SourceStream({ max: 30 });

    exampleStream.pipe(importS3Stream);
    importS3Stream.on("error", () => {
      done();
    });
  });

  it("should handle an error when posting an import job", (done) => {
    const hullClient = getHullClientStub({ error: new Error("API error") });
    const s3 = getS3Stub();
    const importS3Stream = new ImportS3Stream({
      hullClient,
      s3
    }, {
      s3Bucket: "example",
      partSize: 10
    });

    const exampleStream = new SourceStream({ max: 30 });

    exampleStream.pipe(importS3Stream);
    importS3Stream.on("error", (error) => {
      console.log(">>>>>!!! ERROR", error);
      done();
    });
  });

  it.skip("should handle a slow source stream", (done) => {
    const hullClient = getHullClientStub({ error: new Error("API error") });
    const s3 = getS3Stub();
    const importS3Stream = new ImportS3Stream({
      hullClient,
      s3
    }, {
      s3Bucket: "example",
      partSize: 10
    });

    const exampleStream = new SourceStream({ max: 30 });

    exampleStream.pipe(importS3Stream);
    importS3Stream.on("error", () => {
      done();
    });
  });
});

