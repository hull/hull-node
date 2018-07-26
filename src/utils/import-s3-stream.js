// @flow
const { Writable, PassThrough } = require("stream");
const AWS = require("aws-sdk");
const uuid = require("uuid/v1");
const zlib = require("zlib");
const _ = require("lodash");
const debug = require("debug")("hull-import-s3-stream");
const moment = require("moment");

/**
 * This
 * @example
 * const hullImportStream = new HullImportStream()
 */
class ImportS3Stream extends Writable {
  /*
   * Dependencies
   */
  hullClient: Object; // authorized HullClient instance
  s3: AWS.S3; // authorized s3 client

  /*
   * Options
   */
  s3Bucket: string;
  s3ACL: string;
  s3KeyTemplate: string;
  s3SignedUrlExpires: number;

  gzipEnabled: boolean;
  partSize: number;

  importId: string;
  overwrite: boolean;
  notify: boolean;
  emitEvent: boolean;
  importType: "users" | "accounts" | "events";
  importScheduleAt: (partIndex: number) => string;
  importNameTemplate: string;

  /*
   * Internals
   */
  currentUploadStream: null | Writable; // contains current uploadImport stream
  currentObjectIndex: number;
  currentPartIndex: number;
  uploadAndImportPromises: Array<Promise<*>>;
  partEndIndexes: { [partIndex: number]: number };
  uploadResults: Array<Object>;
  importResults: Array<Object>;

  constructor(dependencies: Object, options: Object) {
    if (typeof dependencies.hullClient !== "object") {
      throw new Error("HullImportS3Stream requires HullClient instance");
    }

    if (typeof dependencies.s3 !== "object") {
      throw new Error("HullImportS3Stream requires AWS.S3 instance");
    }

    if (typeof options.s3Bucket !== "string") {
      throw new Error("HullImportS3Stream requires s3Bucket option");
    }

    options.objectMode = true;
    super(options);

    this.hullClient = dependencies.hullClient;
    this.s3 = dependencies.s3;

    this.gzipEnabled = options.gzipEnabled !== undefined ? options.gzipEnabled : true;
    this.s3Bucket = options.s3Bucket;
    this.s3ACL = options.s3ACL || "private";
    this.s3KeyTemplate = options.s3KeyTemplate || "<%= partIndex %>.json";
    this.s3SignedUrlExpires = options.s3SignedUrlExpires || 86400; // seconds
    this.importId = options.importId || uuid();
    this.overwrite = options.overwrite || false;
    this.notify = options.notify || false;
    this.emitEvent = options.emitEvent || false;
    this.importType = options.importType || "users";
    this.importScheduleAt = options.importScheduleAt || ((partIndex) => {
      return moment().add((2 * partIndex), "minutes").toISOString();
    });
    this.partSize = options.partSize || 10000;
    this.importNameTemplate = options.importNameTemplate || "Import - part <%= partIndex %>";

    this.currentUploadStream = null;
    this.currentObjectIndex = 0;
    this.currentPartIndex = 0;
    this.uploadAndImportPromises = [];
    this.partEndIndexes = {};
    this.uploadResults = [];
    this.importResults = [];
    debug("intialized writable stream", {
      importId: this.importId
    });

    this.once("internal-error", (error) => {
      debug("internal-error-handler", error);
      const timeoutId = setTimeout(() => {
        this.emit("error", error);
      }, 500);
      this._final(() => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        this.emit("error", error);
      });
    });
  }

  /**
   * The main method which perform the upload-import stream rotation.
   * First it checks if we have an existing `this.currentUploadStream`.
   * If so it writes the object into the stream.
   * After finishing the write operation it checks if we are at the end of the `this.partSize`.
   * If so we end the current stream and after this operation we save the `this.partEndIndexes` and continue.
   * Otherwise we just continue.
   *
   * @see    https://nodejs.org/docs/latest-v8.x/api/stream.html#stream_writable_write_chunk_encoding_callback_1
   * @param  {Object} object:   Object
   * @param  {string} encoding: string
   * @param  {Function} callback: Function
   * @return {void}
   */
  // $FlowFixMe
  _write(object: Object, encoding: string, callback: Function) {
    const debugPayload = {
      objectType: typeof object,
      currentUploadStream: this.currentUploadStream !== null,
      currentObjectIndex: this.currentObjectIndex,
      currentPartIndex: this.currentPartIndex,
      uploadAndImportPromises: this.uploadAndImportPromises.length
    };
    debug("_write %o", debugPayload);

    if (this.currentUploadStream === null) {
      const newUploadAndImportJob = this.createUploadAndImportJob(this.currentPartIndex, this.currentObjectIndex);
      this.currentUploadStream = newUploadAndImportJob.uploadStream;
      this.uploadAndImportPromises.push(newUploadAndImportJob.uploadAndImportPromise);
      this.emit("upload-stream-new", debugPayload);
      debug("upload-stream-new %o", debugPayload);
    }

    // $FlowFixMe
    this.currentUploadStream.write(`${JSON.stringify(object)}\n`, (err) => {
      debug("write-callback %o", { error: typeof err });
      // we are done with this partSize, let's close the current stream
      if ((this.currentObjectIndex + 1) % this.partSize === 0) {
        this.emit("upload-stream-end", debugPayload);
        debug("upload-stream-end %o", debugPayload);
        // $FlowFixMe
        this.currentUploadStream.end(() => {
          // let's store the indexes when we ended the stream for future reference,
          // then up the current indexes, clear current stream and continue
          this.partEndIndexes[this.currentPartIndex] = this.currentObjectIndex;
          this.currentObjectIndex += 1;
          this.currentPartIndex += 1;
          this.currentUploadStream = null;
          callback(err);
        });
      } else {
        // otherwise lets just up the `this.currentObjectIndex` and continue
        this.currentObjectIndex += 1;
        callback(err);
      }
    });
  }

  /**
   * This is the method delaying the `finish` stream event.
   * It's responsible for waiting for all upload-import promises to finish.
   * Additionally if we end in the middle of last `this.partSize` we end the current stream before waiting for all promises.
   *
   * @see    https://nodejs.org/docs/latest-v8.x/api/stream.html#stream_writable_final_callback
   * @param  {Function} callback: Function
   * @return {void}
   */
  _final(callback: Function) {
    debug("_final %o", { uploadAndImportPromises: this.uploadAndImportPromises, currentUploadStream: typeof this.currentUploadStream });
    const finalize = () => {
      Promise.all(this.uploadAndImportPromises)
        .then(() => callback())
        .catch(error => callback(error));
    };
    if (this.currentUploadStream !== null) {
      // $FlowFixMe
      this.currentUploadStream.end(() => {
        this.partEndIndexes[this.currentPartIndex] = this.currentObjectIndex;
        this.currentUploadStream = null;
        finalize();
      });
    } else {
      finalize();
    }
  }

  /**
   * This method initiates the "upload-import" job which consists of a writable Stream and a promise.
   *
   * If the upload promise is rejected we make sure that the `uploadStream` is destroyed.
   * Then we make sure that the `this.currentUploadStream` is the same stream and set the property to null meaning that the stream
   * ended and cannot accept any more writes. Then we emit `error` event on the `ImportS3Stream`, so it stops accepting more data and try to finalize what was started.
   *
   * If the import operation fails we emit `error` event stopping the `ImportS3Stream` to accept more data. It will trigger a finalize to wait for all pending promises to resolve.
   */
  createUploadAndImportJob(partIndex: number, objectIndex: number): {
    uploadAndImportPromise: Promise<*>,
    uploadStream: Writable
  } {
    const { uploadPromise, uploadStream } = this.createS3Upload({ partIndex, objectIndex });
    this.emit("part-upload-start", { partIndex, objectIndex, partEndIndexes: this.partEndIndexes });
    debug("part-upload-start %o", { partIndex, objectIndex });
    const uploadAndImportPromise = uploadPromise
      .catch((uploadError) => {
        this.emit("part-upload-error", uploadError);
        debug("part-upload-error", uploadError.message);
        // $FlowFixMe
        this.currentUploadStream.destroy(uploadError);
        if (this.currentUploadStream === uploadStream) {
          this.currentUploadStream = null;
        }
        this.emit("internal-error", uploadError);
        return Promise.reject(uploadError);
      })
      .then((uploadResult) => {
        this.uploadResults.push(uploadResult);
        const size = (this.partEndIndexes[partIndex] - objectIndex) + 1;
        const url = uploadResult.SignedUrl;
        const eventPayload = { partIndex, objectIndex, uploadResult, size, stopObjectIndex: this.partEndIndexes[partIndex] };
        this.emit("part-upload-complete", eventPayload);
        debug("part-upload-complete %o", eventPayload);
        return this.postImportJob(url, { partIndex, objectIndex, size })
          .catch((importError) => {
            this.emit("part-import-error", importError);
            debug("part-import-error", importError.message);
            this.emit("internal-error", importError);
            return Promise.reject(importError);
          });
      })
      .then((importResult) => {
        this.importResults.push(importResult);
        this.emit("part-import-complete", importResult);
        debug("part-import-complete %o", importResult);
        return importResult;
      })
      .catch(() => {});
    return {
      uploadAndImportPromise,
      uploadStream
    };
  }

  /**
   * If any internal `PassThrough` stream errors out we abort the upload resulting in `uploadPromise` rejection.
   * Refer to `createUploadAndImportJob` method to see how this case is handled.
   * Both internal streams are destroyed and cleanedup.
   */
  createS3Upload({ partIndex, objectIndex }: Object): {
    uploadPromise: Promise<{ SignedUrl: string }>,
    uploadStream: Writable
  } {
    const uploadStream = new PassThrough();
    let gzippedUploadStream;
    const params = {
      Bucket: this.s3Bucket,
      Key: _.template(this.s3KeyTemplate)({ partIndex, objectIndex }),
      Body: uploadStream,
      ContentType: "application/json",
      ContentEncoding: "gzip",
      ACL: this.s3ACL
    };
    debug("upload params %o", _.omit(params, "Body"));
    const upload = this.s3.upload(params);
    if (this.gzipEnabled === true) {
      gzippedUploadStream = new PassThrough();
      gzippedUploadStream.pipe(zlib.createGzip()).pipe(uploadStream);
      gzippedUploadStream.on("error", (error) => {
        // $FlowFixMe
        gzippedUploadStream.destroy(error);
        // $FlowFixMe
        uploadStream.destroy(error);
        upload.abort();
      });
    }
    uploadStream.on("error", (error) => {
      // $FlowFixMe
      uploadStream.destroy(error);
      upload.abort();
    });
    const uploadPromise = upload.promise().then((uploadResult) => {
      const url = this.s3.getSignedUrl("getObject", { Bucket: params.Bucket, Key: params.Key, Expires: this.s3SignedUrlExpires });
      uploadResult.SignedUrl = url;
      return uploadResult;
    });
    return {
      uploadPromise,
      uploadStream: gzippedUploadStream || uploadStream
    };
  }

  postImportJob(url: string, { partIndex, size, objectIndex }: Object) {
    const params = {
      url,
      format: "json",
      notify: this.notify,
      emit_event: this.emitEvent,
      overwrite: this.overwrite,
      name: _.template(this.importNameTemplate)({ partIndex, size, objectIndex }),
      schedule_at: this.importScheduleAt(partIndex),
      stats: { size },
      size,
      import_id: this.importId,
      part_number: partIndex
    };
    debug("import params %o", params);
    return this.hullClient
      .post(`/import/${this.importType}`, params);
  }
}

module.exports = ImportS3Stream;
