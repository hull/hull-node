// @flow
import type { Readable } from "stream";

const promisePipe = require("promisepipe");
const promiseToWritableStream = require("./promise-to-writable-stream");

function pipeStreamToPromise(
  readableStream: Readable,
  callback: (chunk: any, encoding?: string) => Promise<*>
): Promise<*> {
  const writableStream = promiseToWritableStream(callback);
  return promisePipe(readableStream, writableStream);
}

module.exports = pipeStreamToPromise;
