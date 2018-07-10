/**
 * This is a set of additional helper functions being exposed at `req.hull.helpers`. They allow to perform common operation in the context of current request. They are similar o `req.hull.client.utils`, but operate at higher level, ensure good practises and should be used in the first place before falling back to raw utils.
 *
 * @namespace helpers
 * @memberof Context
 * @public
 */
module.exports.requestExtract = require("./request-extract");
module.exports.handleExtract = require("./handle-extract");
module.exports.updateSettings = require("./update-settings");
