module.exports = function Readme(req, res) {
  return res.redirect(`https://dashboard.hullapp.io/readme?url=https://${req.headers.host}`);
};
