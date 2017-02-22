import path from "path";
import express from "express";

function ManifestRoute(dirname) {
  return function Manifest(req, res) {
    return res.sendFile(path.resolve(dirname, "..", "manifest.json"));
  };
}

function Readme(req, res) {
  return res.redirect(`https://dashboard.hullapp.io/readme?url=https://${req.headers.host}`);
}

export default function staticRouter() {
  const router = express.Router();

  router.use(express.static(`${process.cwd()}/dist`));
  router.use(express.static(`${process.cwd()}/assets`));

  router.get("/manifest.json", ManifestRoute(`${process.cwd()}/dir`));
  router.get("/", Readme);
  router.get("/readme", Readme);

  return router;
}
