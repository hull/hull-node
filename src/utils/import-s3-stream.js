// @flow
const { Writable, PassThrough } = require("stream");
const AWS = require("aws-sdk");
const uuid = require("uuid/v1");
const zlib = require("zlib");
const _ = require("lodash");
const debug = require("debug")("hull-import-s3-stream");

/**
 * This
 * @example
 * const hullImportStream = new HullImportStream()
 */
class ImportS3Stream extends Writable {
  hullClient: Object;
  s3: AWS.S3;

  s3Bucket: string;
  s3ACL: string;
  s3KeyTemplate: string
  importId: string;
  overwrite: boolean;
  partSize: number;
  importType: "users" | "accounts" | "events";
  importDelay: number;
  importNameTemplate: string;

  currentUploadStream: null | Writable;
  currentObjectIndex: number;
  currentPartIndex: number;
  uploadAndImportPromises: Array<Promise<*>>;

  constructor(dependencies, options: Object) {
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

    this.s3Bucket = options.s3Bucket;
    this.s3ACL = options.s3ACL || "private";
    this.s3KeyTemplate = options.s3KeyTemplate || "<%= partIndex %>.json";
    this.importId = options.importId || uuid();
    this.overwrite = options.overwrite || false;
    this.importType = options.importType || "users";
    this.importDelay = options.importDelay || 0;
    this.partSize = options.partSize || 10000;
    this.importNameTemplate = options.importNameTemplate || "Import - part <%= partIndex %>";

    this.currentUploadStream = null;
    this.currentObjectIndex = 0;
    this.currentPartIndex = 0;
    this.uploadAndImportPromises = [];
    debug("intialized writable stream", {
      importId: this.importId
    });
  }

  _write(object: Object, encoding: string, callback: Function) {
    debug("writing %o", {
      currentUploadStream: this.currentUploadStream !== null,
      currentObjectIndex: this.currentObjectIndex,
      currentPartIndex: this.currentPartIndex,
      uploadAndImportPromises: this.uploadAndImportPromises.length
    });
    if (this.currentUploadStream === null || (this.currentObjectIndex + 1) % this.partSize === 0) {
      this.currentPartIndex += 1;
      if (this.currentUploadStream !== null) {
        debug("ending currentUploadStream");
        this.currentUploadStream.end();
      }
      const newUploadAndImportJob = this.createUploadAndImportJob(this.currentPartIndex, this.currentObjectIndex);
      this.currentUploadStream = newUploadAndImportJob.uploadStream;
      this.uploadAndImportPromises.push(newUploadAndImportJob.uploadAndImportPromise);
    }
    this.currentUploadStream.write(`${JSON.stringify(object)}\n`, (err) => {
      debug("wrote", { error: typeof err });
      this.currentObjectIndex += 1;
      callback(err);
    });
  }

  _final(callback: Function) {
    debug("_final", { uploadAndImportPromises: this.uploadAndImportPromises });
    this.currentUploadStream.end();
    Promise.all(this.uploadAndImportPromises)
      .then(() => callback())
      .catch(error => callback(error));
  }

  createUploadAndImportJob(partIndex: number, objectIndex: number): {
    uploadAndImportPromise: Promise<*>,
    uploadStream: Writable
  } {
    const key = "example";
    const { uploadPromise, uploadStream } = this.createS3Upload({ partIndex, objectIndex });
    this.emit("part-upload-start");
    debug("part-upload-start");
    const uploadAndImportPromise = uploadPromise
      .then(uploadResult => {
        const size = this.currentObjectIndex - objectIndex;
        const url = uploadResult.Location;
        this.emit("part-upload-complete %o", uploadResult);
        debug("part-upload-complete", { uploadResult, currentObjectIndex: this.currentObjectIndex, objectIndex });
        return this.postImportJob(url, { partIndex, size, objectIndex });
      }).then(importResult => {
        this.emit("part-import-complete", importResult);
        debug("part-import-complete");
        return importResult;
      });
    return {
      uploadAndImportPromise,
      uploadStream
    };
  }

  createS3Upload({ partIndex, objectIndex }): {
    uploadPromise: Promise<{ Location: string }>,
    uploadStream: Writable
  } {
    const uploadStream = new PassThrough();
    const internalUploadStream = new PassThrough();
    const params = {
      Bucket: this.s3Bucket,
      Key: _.template(this.s3KeyTemplate)({ partIndex, objectIndex }),
      Body: internalUploadStream,
      ContentType: "application/json",
      ContentEncoding: "gzip",
      ACL: this.s3ACL
    };
    debug("upload params %o", _.omit(params, "Body"));
    const upload = this.s3.upload(params);
    uploadStream.pipe(zlib.createGzip()).pipe(internalUploadStream);
    return {
      uploadPromise: upload.promise(),
      uploadStream
    };
  }

  postImportJob(url: string, { partIndex, size, objectIndex }: Object) {
    const params = {
      url,
      format: "json",
      notify: true,
      emit_event: false,
      overwrite: this.overwrite,
      name: _.template(this.importNameTemplate)({ partIndex, size, objectIndex }),
      // schedule_at: moment().add(this.importDelay + (2 * partNumber), "minutes").toISOString(),
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
