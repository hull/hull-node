const crypto = require("hull-client/lib/lib/crypto");

function parseSignedCookie(signedCookie) {
  if (!signedCookie) {
    return null;
  }
  try {
    return JSON.parse(Buffer.from(signedCookie, "base64").toString("utf8"));
  } catch (e) {
    console.warn("Error parsing signed cookie", signedCookie, e.message); //eslint-disable-line no-console
  }
  return null;
}

function currentUserMiddleware(config = {}, req, res, next) {
  req.hull = req.hull || {};
  const cookies = req.cookies || {};
  const { id } = config;
  const cookieName = `hull_${id}`;
  if (!(cookieName in cookies)) {
    return next();
  }

  const signedUser = parseSignedCookie(cookies[cookieName]);
  const userId = signedUser["Hull-User-Id"];
  const userSig = signedUser["Hull-User-Sig"];

  if (signedUser) {
    const valid = crypto.currentUserId(config, userId, userSig);
    if (valid) {
      req.hull.userId = userId;
    }
  }
  return next();
}

module.exports = currentUserMiddleware;
