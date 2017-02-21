import Client from "./client";
import clientMiddleware from "./middleware/client";

Client.Middleware = clientMiddleware.bind(undefined, Client);

module.exports = Client;
