const sinon = require("sinon");
const { PassThrough } = require("stream");
const ImportS3Stream = require("../../../src/utils/import-s3-stream");
// const HullClient = require("hull-client");

// const hullClient = new HullClient({
//   id: "5b45dac946b81804a500001e",
//   secret: "1bd1431c2030060c591c67dc875c10fb",
//   organization: "224bbaa3.hullbeta.io"
// });

describe("ImportS3Stream", () => {
  it("", (done) => {
    const hullClient = {
      post: () => { return Promise.resolve(); }
    };
    const s3 = {
      upload: (options) => {
        console.log("NEW UPLOAD");
        const { Body } = options;
        return {
          promise: () => {
            return new Promise((resolve) => {
              Body.on("finish", () => {
                console.log(">>> ENDED");
                resolve({ Location: "foo://bar" });
              });
            });
          }
        };
      }
    };
    const importS3Stream = new ImportS3Stream({
      hullClient,
      s3
    }, {
      s3Bucket: "example",
      partSize: 3
    });

    const exampleStream = new PassThrough({ objectMode: true });

    exampleStream.pipe(importS3Stream);
    let a = 0;
    const i = setInterval(() => {
      exampleStream.write({ foo: "bar" });
      a += 1;
      if (a === 5) {
        clearInterval(i);
        exampleStream.end();
      }
    }, 100);

    importS3Stream.on("finish", () => {
      console.log("importS3Stream finished");
      done();
    });
  });
});

