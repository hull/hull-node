import Client from "./client";
import clientMiddleware from "./client-middleware";

Client.Middleware = clientMiddleware.bind(undefined, Client);

module.exports = Client;
