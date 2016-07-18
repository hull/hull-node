import NotifHandler from "./notif-handler";
import BatchHandler from "./batch-handler";
import OAuthHandler from "./oauth-handler";

import hullClient from "./middleware/client";
import Client from "./client";

import Readme from "./route/readme";
import Manifest from "./route/manifest";

Client.Middleware = hullClient.bind(undefined, Client);
Client.Routes = { Readme, Manifest };

Client.NotifHandler = NotifHandler.bind(undefined, Client);
Client.BatchHandler = BatchHandler.bind(undefined, Client);
Client.OAuthHandler = OAuthHandler.bind(undefined, Client);

module.exports = Client;
