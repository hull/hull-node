const _ = require("lodash");
const { Router } = require("express");
const passport = require("passport");
const bodyParser = require("body-parser");
const querystring = require("querystring");

const { queryConfigurationMiddleware, clientMiddleware, fetchFullContextMiddleware, timeoutMiddleware, haltOnTimedoutMiddleware } = require("../middlewares");

const HOME_URL = "/";
const LOGIN_URL = "/login";
const CALLBACK_URL = "/callback";
const FAILURE_URL = "/failure";
const SUCCESS_URL = "/success";

function fetchToken(req, res, next) {
  const token = req.query.token || req.query.state;
  if (token && token.split(".").length === 3) {
    req.hull = req.hull || {};
    req.hull.token = token;
  }
  next();
}

/**
 * OAuthHandler is a packaged authentication handler using [Passport](http://passportjs.org/). You give it the right parameters, it handles the entire auth scenario for you.
 *
 * It exposes hooks to check if the ship is Set up correctly, inject additional parameters during login, and save the returned settings during callback.
 *
 * To make it working in Hull dashboard set following line in **manifest.json** file:
 *
 * ```json
 * {
 *   "admin": "/auth/"
 * }
 * ```
 *
 * For example of the notifications payload [see details](./notifications.md)
 *
 * @name oAuthHandler
 * @memberof Utils
 * @public
 * @param  {Object}    options
 * @param  {string}    options.name        The name displayed to the User in the various screens.
 * @param  {boolean}   options.tokenInUrl  Some services (like Stripe) require an exact URL match. Some others (like Hubspot) don't pass the state back on the other hand. Setting this flag to false (default: true) removes the `token` Querystring parameter in the URL to only rely on the `state` param.
 * @param  {Function}  options.isSetup     A method returning a Promise, resolved if the ship is correctly setup, or rejected if it needs to display the Login screen.
 * Lets you define in the Ship the name of the parameters you need to check for. You can return parameters in the Promise resolve and reject methods, that will be passed to the view. This lets you display status and show buttons and more to the customer
 * @param  {Function}  options.onAuthorize A method returning a Promise, resolved when complete. Best used to save tokens and continue the sequence once saved.
 * @param  {Function}  options.onLogin     A method returning a Promise, resolved when ready. Best used to process form parameters, and place them in `req.authParams` to be submitted to the Login sequence. Useful to add strategy-specific parameters, such as a portal ID for Hubspot for instance.
 * @param  {Function}  options.Strategy    A Passport Strategy.
 * @param  {Object}    options.views       Required, A hash of view files for the different screens: login, home, failure, success
 * @param  {Object}    options.options     Hash passed to Passport to configure the OAuth Strategy. (See [Passport OAuth Configuration](http://passportjs.org/docs/oauth))
 * @return {Function} OAuth handler to use with expressjs
 * @example
 * const { oAuthHandler } = require("hull/lib/utils");
 * const { Strategy as HubspotStrategy } = require("passport-hubspot");
 *
 * const app = express();
 *
 * app.use(
 *   '/auth',
 *   oAuthHandler({
 *     name: 'Hubspot',
 *     tokenInUrl: true,
 *     Strategy: HubspotStrategy,
 *     options: {
 *       clientID: 'xxxxxxxxx',
 *       clientSecret: 'xxxxxxxxx', //Client Secret
 *       scope: ['offline', 'contacts-rw', 'events-rw'] //App Scope
 *     },
 *     isSetup(req) {
 *       if (!!req.query.reset) return Promise.reject();
 *       const { token } = req.hull.ship.private_settings || {};
 *       return !!token
 *       ? Promise.resolve({ valid: true, total: 2 })
 *       : Promise.reject({ valid: false, total: 0 });
 *     },
 *     onLogin: req => {
 *       req.authParams = { ...req.body, ...req.query };
 *       return req.hull.client.updateSettings({
 *         portalId: req.authParams.portalId
 *       });
 *     },
 *     onAuthorize: req => {
 *       const { refreshToken, accessToken } = req.account || {};
 *       return req.hull.client.updateSettings({
 *         refresh_token: refreshToken,
 *         token: accessToken
 *       });
 *     },
 *     views: {
 *       login: 'login.html',
 *       home: 'home.html',
 *       failure: 'failure.html',
 *       success: 'success.html'
 *     }
 *   })
 * );
 *
 * //each view will receive the following data:
 * {
 *   name: "The name passed as handler",
 *   urls: {
 *     login: '/auth/login',
 *     success: '/auth/success',
 *     failure: '/auth/failure',
 *     home: '/auth/home',
 *   },
 *   ship: ship //The entire Ship instance's config
 * }
 */
function oauthHandlerFactory({ HullClient }, {
  name,
  tokenInUrl = true,
  isSetup = function setup() { return Promise.resolve(); },
  onAuthorize = function onAuth() { return Promise.resolve(); },
  onLogin = function onLog() { return Promise.resolve(); },
  Strategy,
  views = {},
  options = {}
}) {
  function getURL(req, url, qs = { token: req.hull.token }) {
    const host = `https://${req.hostname}${req.baseUrl}${url}`;
    if (qs === false) return host;
    return `${host}?${querystring.stringify(qs)}`;
  }
  function getURLs(req) {
    return {
      login: getURL(req, LOGIN_URL),
      success: getURL(req, SUCCESS_URL),
      failure: getURL(req, FAILURE_URL),
      home: getURL(req, HOME_URL)
    };
  }

  const router = Router();

  router.use(fetchToken);
  router.use(queryConfigurationMiddleware()); // parse config from token
  router.use(clientMiddleware({ HullClient })); // initialize client
  router.use(timeoutMiddleware());
  router.use(fetchFullContextMiddleware({ requestName: "oAuth" }));
  router.use(haltOnTimedoutMiddleware());
  router.use(passport.initialize());
  router.use(bodyParser.urlencoded({ extended: true }));

  passport.serializeUser((req, user, done) => {
    req.user = user;
    done(null, user);
  });

  const strategy = new Strategy(_.merge({}, options, { passReqToCallback: true }), function verifyAccount(req, accessToken, refreshToken, params, profile, done) {
    if (done === undefined) {
      done = profile;
      profile = params;
      params = undefined;
    }
    done(undefined, { accessToken, refreshToken, params, profile });
  });

  passport.use(strategy);

  router.get(HOME_URL, (req, res) => {
    const { ship = {}, client } = req.hull;
    client.logger.debug("connector.oauth.home");
    const data = { name, urls: getURLs(req), ship };
    isSetup(req)
      .then(
        (setup = {}) => { res.render(views.home, _.merge({}, data, setup)); },
        (setup = {}) => { res.render(views.login, _.merge({}, data, setup)); }
      );
  });

  function authorize(req, res, next) {
    passport.authorize(strategy.name, _.merge(
      {},
      req.authParams,
      { callbackURL: getURL(req, CALLBACK_URL, tokenInUrl ? { token: req.hull.token } : false) }
    ))(req, res, next);
  }

  router.all(LOGIN_URL, (req, res, next) => {
    const { client } = req.hull;
    client.logger.debug("connector.oauth.login");
    onLogin(req)
      .then(() => next())
      .catch(() => next());
  }, (req, res, next) => {
    req.authParams = _.merge(
      {},
      req.authParams,
      { state: req.hull.token }
    );
    next();
  }, authorize);

  router.get(FAILURE_URL, function loginFailue(req, res) {
    const { client } = req.hull;
    client.logger.debug("connector.oauth.failure");
    return res.render(views.failure, { name, urls: getURLs(req) });
  });

  router.get(SUCCESS_URL, function login(req, res) {
    const { client } = req.hull;
    client.logger.debug("connector.oauth.success");
    return res.render(views.success, { name, urls: getURLs(req) });
  });

  router.get(CALLBACK_URL, authorize, (req, res) => {
    const { client } = req.hull;
    client.logger.debug("connector.oauth.authorize");
    onAuthorize(req)
      .then(() => res.redirect(getURL(req, SUCCESS_URL)))
      .catch(error => res.redirect(getURL(req, FAILURE_URL, { token: req.hull.token, error })));
  });

  router.use((error, req, res, next) => { // eslint-disable-line no-unused-vars
    const { client } = req.hull;
    client.logger.error("connector.oauth.error", error);
    return res.render(views.failure, { name, urls: getURLs(req), error: error.message || error.toString() || "" });
  });

  return router;
}

module.exports = oauthHandlerFactory;
