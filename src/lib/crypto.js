// @flow
const crypto = require("crypto");
const qs = require("querystring");

const algorithm = "aes-128-cbc";

const encrypt = (source: string | {}, password: string) => {
  const cipher = crypto.createCipher(algorithm, password);
  const data = typeof source === "string" ? source : qs.stringify(source)
  let crypted = cipher.update(data, "utf8", "base64");
  crypted += cipher.final("base64");
  return encodeURIComponent(crypted);
};

const decrypt = (text: string, password: string) => {
  const decipher = crypto.createDecipher(algorithm, password);
  let dec = decipher.update(decodeURIComponent(text), "base64", "utf8");
  dec += decipher.final("utf8");
  return qs.parse(dec);
};

module.exports.encrypt = encrypt;
module.exports.decrypt = decrypt;
