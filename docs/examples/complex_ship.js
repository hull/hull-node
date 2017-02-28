import Hull from "hull/src";
import Promise from "bluebird";
import express from "express";

// pick what we need from the hull-node
import { batchHandler, notifHandler, actionHandler, batcherHandler, oAuthHandler } from "hull/src/utils";

import { Strategy as HubspotStrategy } from "passport-hubspot";

const port = process.env.PORT || 8082;
const hostSecret = process.env.SECRET || "1234";

/**
 * A set of custom logic, should be loaded from external directory
 * @type {Object}
 */
const service = {
  sendUsers: (ctx, users) => {
    users.map(u => {
      ctx.service.transformUsers(u);
    });
    return ctx.enqueue("exampleJob", { users });
  }
}

const connector = new Hull.Connector({ port, hostSecret, service });
const app = express();
connector.setupApp(app);

/**
 * Custom endpoint to trigger a custom action
 */
app.use("/fetch-all", actionHandler((ctx, { query, body }) => {
  ctx.client.logger.info("fetch-all", ctx.segments.map(s => s.name), { query, body });
  return ctx.enqueue("fetchAll", { body });
}));

/**
 * Custom endpoint to fetch incoming data
 */
app.use("/webhook", batcherHandler((ctx, messages) => {
  ctx.client.logger.info("Batcher.messages", messages);
}));


/**
 * Handle a outgoing batch of users coming from Hull
 */
app.use("/batch", batchHandler((ctx, users) => {
  const { service } = ctx;
  return service.sendUsers(users);
}, { batchSize: 100, groupTraits: true }));


/**
 * Handle selected events happening on Hull platform
 */
app.use("/notify", notifHandler({
  userHandlerOptions: {
    groupTraits: true,
    maxSize: 6,
    maxTime: 10000
  },
  handlers: {
    "ship:update": (ctx, messages) => {
      ctx.client.logger.info("ship was updated");
    },
    "user:update": (ctx, messages) => {
      const { client } = ctx;
      ctx.client.logger.info("users was updated", messages[0]);
      client.logger.info("user was updated", messages.map(m => m.user.email));
    }
  }
}));


/**
 * A handler to ease the oAuth flow
 */
app.use("/auth", oAuthHandler({
  name: "Hubspot",
  Strategy: HubspotStrategy,
  options: {
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    scope: ["offline", "contacts-rw", "events-rw"],
    skipUserProfile: true
  },
  isSetup(req) {
    if (req.query.reset) return Promise.reject();
    if (req.hull.ship.private_settings.token) {
      return Promise.resolve({ settings: req.hull.ship.private_settings });
    }
    return Promise.reject();
  },
  onLogin: (req) => {
    req.authParams = { ...req.body, ...req.query };
    return req.hull.client.updateSettings({
      portal_id: req.authParams.portalId
    });
  },
  onAuthorize: (req) => {
    const { refreshToken, accessToken, expiresIn } = (req.account || {});
    return req.hull.client.updateSettings({
      refresh_token: refreshToken,
      token: accessToken,
      expires_in: expiresIn
    });
  },
  views: {
    login: "login.html",
    home: "home.html",
    failure: "failure.html",
    success: "success.html"
  }
}));

connector.worker({
  exampleJob: (ctx, { users }) => {
    console.log("exampleJob", users.length);
  },
  fetchAll: (ctx, { body }) => {
    console.log("fetchAllJob", ctx.segments.map(s => s.name), body);
  }
})


connector.startApp(app);
connector.startWorker();
