// @flow
const { Writable, PassThrough } = require("stream");
const AWS = require("aws-sdk");
const uuid = require("uuid/v1");
const debug = require("debug")("hull-import-s3-stream");

/**
 * This
 * @example
 * const hullImportStream = new HullImportStream()
 */
class ImportS3Stream extends Writable {
  hullClient: Object;
  s3Bucket: string;
  importId: string;
  overwrite: boolean;
  partSize: number;
  importType: "users" | "accounts" | "events";

  currentUploadStream: null | Writable;
  currentObjectIndex: number;
  currentPartIndex: number;
  uploadAndImportPromises: Array<Promise<*>>;

  constructor(options: Object) {
    if (typeof options.hullClient !== "object") {
      throw new Error("HullImportS3Stream requires HullClient instance");
    }

    if (typeof options.s3Bucket !== "string") {
      throw new Error("HullImportS3Stream requires s3Bucket option");
    }

    options.objectMode = true;
    super(options);

    this.hullClient = options.hullClient;
    this.s3Bucket = options.s3Bucket;
    this.importId = options.importId || uuid();
    this.overwrite = options.overwrite || false;
    this.importType = options.importType || "users";
    this.partSize = options.partSize || 10000;

    this.currentUploadStream = null;
    this.currentObjectIndex = 0;
    this.currentPartIndex = 0;
    this.uploadAndImportPromises = [];
    debug("intialized writable stream", options);
  }

  _write(object: Object, encoding: string, callback: Function) {
    if (this.currentUploadStream === null || this.currentObjectIndex % this.partSize === 0) {
      this.currentPartIndex += 1;
      if (this.currentUploadStream) {
        this.currentUploadStream.end();
      }
      const newUploadAndImportJob = this.createUploadAndImportJob(this.currentPartIndex, this.currentObjectIndex);
      this.currentUploadStream = newUploadAndImportJob.uploadStream;
      this.uploadAndImportPromises.push(newUploadAndImportJob.uploadAndImportPromise);
    }
    this.currentUploadStream.write(`${JSON.stringify(object)}\n`, (err) => {
      this.currentObjectIndex += 1;
      callback(err);
    });
  }

  _final(callback: Function) {
    Promise.all(this.uploadAndImportPromises)
      .then(() => callback())
      .catch(error => callback(error));
  }

  createUploadAndImportJob(partIndex: number, objectIndex: number): {
    uploadAndImportPromise: Promise<*>,
    uploadStream: Writable
  } {
    const key = "example";
    const { uploadPromise, uploadStream } = this.createS3Upload(key);
    this.emit("part-upload-start");
    const uploadAndImportPromise = uploadPromise
      .then(uploadResult => {
        const size = this.currentObjectIndex - objectIndex;
        this.emit("part-upload-complete", uploadResult);
        const url = uploadResult.Location;
        return this.postImportJob(url, partIndex, size);
      }).then(importResult => {
        this.emit("part-import-complete", importResult);
        return importResult;
      });
    return {
      uploadAndImportPromise,
      uploadStream
    };
  }

  createS3Upload(key: string): {
    uploadPromise: Promise<{ Location: string }>,
    uploadStream: Writable
  } {
    var s3 = new AWS.S3();
    const uploadStream = new PassThrough();
    const params = {
      Bucket: this.s3Bucket,
      Key: key,
      Body: uploadStream
    };
    const upload = s3.upload(params);
    return {
      uploadPromise: upload.promise(),
      uploadStream
    };
  }

  postImportJob(url: string, partNumber: number, size: number) {
    const params = {
      url,
      format: "json",
      notify: true,
      emit_event: false,
      overwrite: this.overwrite,
      name: ` - part ${partNumber}`,
      // schedule_at: moment().add(this.importDelay + (2 * partNumber), "minutes").toISOString(),
      stats: { size },
      size,
      import_id: this.importId,
      part_number: partNumber
    };
    return this.hullClient
      .post(`/import/${this.importType}`, params);
  }
}

module.exports = ImportS3Stream;
