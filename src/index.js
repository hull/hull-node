import Client from "hull-client";

import clientMiddleware from "./middleware/client";
import HullConnector from "./connector/hull-connector";

Client.Middleware = clientMiddleware.bind(undefined, Client);
Client.Connector = HullConnector.bind(undefined, Client);

module.exports = Client;
