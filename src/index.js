import Client from "./client";
import clientMiddleware from "./middleware/client";
import HullApp from "./app/hull-app";

Client.Middleware = clientMiddleware.bind(undefined, Client);
Client.App = HullApp.bind(undefined, Client);

module.exports = Client;
