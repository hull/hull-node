const crypto = require("hull-client/lib/lib/crypto");

function parseSignedCookie(signedCookie) {
  if (!signedCookie) { return null; }
  try {
    return JSON.parse(new Buffer(signedCookie, "base64").toString("utf8"));
  } catch (e) {
    console.warn("Error parsing signed cookie", signedCookie, e.message);
  }
  return null;
}

module.exports = function CurrentUser(config = {}, req, res, next) {
  req.hull = req.hull || {};
  const cookies = req.cookies || {};
  const { id } = config;
  const cookieName = `hull_${id}`;
  if (!(cookieName in cookies)) { return next(); }

  const signedUser = parseSignedCookie(cookies[cookieName]);
  const userId = signedUser["Hull-User-Id"];
  const userSig = signedUser["Hull-User-Sig"];

  if (signedUser) {
    const valid = crypto.currentUserId(config, userId, userSig);
    if (valid) {
      req.hull.userId = userId;
    }
  }
  next();
};
