const sinon = require("sinon");
const { Readable } = require("stream");
const ImportS3Stream = require("../../../src/utils/import-s3-stream");


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
          this.destroy(new Error("Failed reading"))
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
    upload: (options) => {
      const { Body } = options;
      let rejectNewPromise;
      const newPromise = new Promise((resolve, reject) => {
        rejectNewPromise = (error) => {
          reject(error);
        };
        Body
          .on("end", () => {
            setTimeout(() => {
              resolve({ Location: `dummy-s3://${options.Bucket}/${options.Key}` });
            }, delay);
          });
        Body
          .on("readable", () => {
            let chunk;
            while (null !== (chunk = Body.read(14))) {
              if (errorAt && errorAt === index) {
                Body.destroy(new Error("Failed writing"));
                break;
              }
              index += 1;
            }
          })
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

describe("ImportS3Stream", () => {
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
    exampleStream.pipe(importS3Stream);

    importS3Stream.on("finish", () => {
      done();
    });
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
    importS3Stream.on("finish", (error) => {
      console.log("finish", error);
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
    importS3Stream.on("finish", (error) => {
      console.log("finish", error);
      done();
    });
  });
});

