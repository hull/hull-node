// @flow
const { Readable } = require("stream");
const debug = require("debug")("promise-to-readable-stream");

/**
 * A helper function which creates a readable stream.
 * When [_read](https://nodejs.org/docs/latest-v8.x/api/stream.html#stream_readable_read_size_1) function
 * is called it runs the provided promise to start reading data.
 * The provided promise is executed with `push` function as first and only argument, thanks to that
 * promise can push data to the stream in a free manner.
 *
 * When promise resolves the stream is ended. When the promise is rejected the stream is [destroyed](https://nodejs.org/api/stream.html#stream_readable_destroy_error)
 */
function promiseToReadableStream(
  promise: (chunk: any, encoding?: string) => Promise<any>
): Readable {
  let called = false;
  return new Readable({
    objectMode: true,
    read() {
      if (called === true) {
        return;
      }
      called = true;
      promise(this.push.bind(this))
        .then(() => {
          debug("promise resolved, pushing null to readable stream");
          this.push(null);
        })
        .catch(error => {
          debug("error while reading data from promise", error);
          this.destroy(error);
        });
    },
  });
}

module.exports = promiseToReadableStream;
