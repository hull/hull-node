const Client = require("hull-client");

const clientMiddleware = require("./middleware/client");
const HullConnector = require("./connector/hull-connector");

Client.Middleware = clientMiddleware.bind(undefined, Client);
Client.Connector = HullConnector.bind(undefined, Client);

module.exports = Client;
