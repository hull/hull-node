import Client from "hull-client";
import clientMiddleware from "./middleware/client";
import HullConnector from "./connector/hull-connector";


//   this.currentUserMiddleware = currentUserMiddleware.bind(this, clientConfig.get());
// this.utils.extract = {
//   request: extract.request.bind(this),
//   handle: extract.handle.bind(this),
// }

Client.Middleware = clientMiddleware.bind(undefined, Client);
Client.Connector = HullConnector.bind(undefined, Client);

module.exports = Client;
