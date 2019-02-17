// @flow
const { Transform } = require("stream");
const debug = require("debug")("promise-to-readable-stream");

/**
 * A helper function which allows to easily use promise as a transform stream.
 * This promise will be called with every chunk of the stream,
 * then it can use two ways of pushing transformed data back to the stream.
 * It can resolve to a non null, non undefined value and this will passed down.
 * Otherwise it can accept third argument which is push function - using the push function allows
 * to push multiple chunks from one promise call.
 * When the promise rejects error will be passed to the wrapping stream as an error event.
 */
function promiseToTransformStream(
  promise: (chunk: any, encoding?: string, push?: Function) => Promise<any>
): Transform {
  return new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      debug("writing to a promise");
      promise(chunk, encoding, this.push.bind(this))
        .then(promiseResult => {
          if (promiseResult !== undefined && promiseResult !== null) {
            callback(null, promiseResult);
          } else {
            callback(null);
          }
        })
        .catch(error => callback(error));
    },
  });
}
module.exports = promiseToTransformStream;
