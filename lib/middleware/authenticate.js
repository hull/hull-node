module.exports = function authenticate(client) {
  
  function parseSignedCookie(signedCookie) {
    if (!signedCookie) { return; }
    try {
      return JSON.parse(new Buffer(signedCookie, 'base64').toString('utf8'));  
    } catch(e) {
      console.warn("Error parsing signed cookie", signedCookie, e.message);
    }
  }

  return function(req, res, next) {
    var cookieName = "hull_" + client.conf.appId;
    var signedUser = parseSignedCookie(req.cookies[cookieName]);
    req.hull = req.hull || {};
    if (signedUser) {
      req.hull.userId = client.checkSignedUserId(signedUser['Hull-User-Id'], signedUser['Hull-User-Sig']);
    }
    next();
  }

}