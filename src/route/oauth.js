import express from "express";
import bodyParser from "body-parser";
// import fetchShip from "./lib/fetch-ship";
// import passport from "passport";

export default function OAuth({ name, slug, Strategy, callbackUrl, homeUrl }) {
  // function getUrl(req, url){
  //   return `https://${req.hostname}${req.baseUrl}${url}?hullToken=${req.hull.hullToken}`;
  // }

  const router = express.Router();

  // passport.use(Strategy);

  router.use(bodyParser.json());
  // router.use(fetchShip);

  // router.get(homeUrl, (req, res) => {
  //   const { ship = {}, } = req.hull;
  //   const { domain, api_key: apiKey, list_id: listID } = ship.private_settings || {};
  //   const data = { name, url: getUrl(req, '/login') };
  //   if (!apiKey) {
  //     return res.render("login.html", data);
  //   }
  //   return res.render("admin.html", data);
  // });

  // router.get('/login', (req, res, next) => {
  //   const { ship = {}, } = req.hull;
  //   const { domain, api_key: apiKey, list_id: listID } = ship.private_settings || {};
  //   passport.authenticate(slug, { callbackURL: getUrl(req, callbackUrl) })(req,res,next);
  // });

  // router.get(callbackUrl, passport.authorize(slug, {
  //   failureRedirect: '/account',
  //   successRedirect: '/toot'
  // }, (req, res)=> console.log('Resp', req)
  // ));

  return router;
}


// , (req, res) => {
//     console.log('CBU')
//     try {
//       const { ship = {}, client: hull } = req.hull;
//       const message = JSON.parse(body);
//       console.log(message)
//       if (message && message.error) { return res.send(`Error: ${message.error}`); }
//       if (message && message.access_token) {
//         hull.put(ship.id, { private_settings: { ...ship.private_settings, token: message.access_token }} )
//         .then( () => res.render("finished.html") , err => res.send(err) );
//       }
//       return res.send(`Could not find access token in ${body}`);
//     } catch (e) {
//       return res.send(`Could not parse response: ${body}`);
//     }
//   }
