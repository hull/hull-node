import express from "express";
import passport from "passport";
import bodyParser from "body-parser";
import querystring from "querystring";
import hullClient from "./middleware/client";

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

export default function oauth(Client, {
  name,
  isSetup = function setup() { return Promise.resolve(); },
  onAuthorize = function onAuth() { return Promise.resolve(); },
  onLogin = function onLog() { return Promise.resolve(); },
  hostSecret = "",
  Strategy,
  views = {},
  options = {},
  shipCache = null
}) {
  function getURL(req, url, qs = { token: req.hull.token }) {
    return `https://${req.hostname}${req.baseUrl}${url}?${querystring.stringify(qs)}`;
  }
  function getURLs(req) {
    return {
      login: getURL(req, LOGIN_URL),
      success: getURL(req, SUCCESS_URL),
      failure: getURL(req, FAILURE_URL),
      home: getURL(req, HOME_URL)
    };
  }

  const router = express.Router();

  router.use(fetchToken);
  router.use(passport.initialize());
  router.use(bodyParser.json());
  router.use(bodyParser.urlencoded({ extended: true }));

  passport.serializeUser((req, user, done) => {
    req.user = user;
    done(null, user);
  });

  const strategy = new Strategy({ ...options, passReqToCallback: true }, function verifyAccount(req, accessToken, refreshToken, params, profile, done) {
    done(undefined, { accessToken, refreshToken, params, profile });
  });

  passport.use(strategy);


  const hullMiddleware = hullClient(Client, { hostSecret, fetchShip: true, cacheShip: false, shipCache });

  router.get(HOME_URL, hullMiddleware, (req, res) => {
    const { client, ship = {}, } = req.hull;
    const data = { name, urls: getURLs(req), ship };
    isSetup(req, { hull: client, ship })
      .then(
        (setup = {}) => { res.render(views.home, { ...data, ...setup }); },
        (setup = {}) => { res.render(views.login, { ...data, ...setup }); }
      );
  });

  function authorize(req, res, next) {
    passport.authorize(strategy.name, {
      ...req.authParams,
      callbackURL: getURL(req, CALLBACK_URL)
    })(req, res, next);
  }

  router.all(LOGIN_URL, hullMiddleware, (req, res, next) => {
    onLogin(req, { hull: req.hull.client, ship: req.hull.ship })
      .then(() => next())
      .catch(() => next());
  }, (req, res, next) => {
    req.authParams = {
      ...req.authParams,
      state: req.hull.token
    };
    next();
  }, authorize);

  router.get(FAILURE_URL, hullMiddleware, function loginFailue(req, res) { return res.render(views.failure, { name, urls: getURLs(req) }); });
  router.get(SUCCESS_URL, hullMiddleware, function login(req, res) { return res.render(views.success, { name, urls: getURLs(req) }); });

  router.get(CALLBACK_URL, hullMiddleware, authorize, (req, res) => {
    onAuthorize(req, { hull: req.hull.client, ship: req.hull.ship })
      .then(() => res.redirect(getURL(req, SUCCESS_URL)))
      .catch((error) => res.redirect(getURL(req, FAILURE_URL, { token: req.hull.token, error })));
  });

  return router;
}
