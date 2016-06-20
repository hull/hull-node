import path from "path";

module.exports = function ManifestRoute(dirname) {
  return function Manifest(req, res) {
    return res.sendFile(path.resolve(dirname, "..", "manifest.json"));
  };
};
