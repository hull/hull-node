import _ from "lodash";
import connect from "connect";
import bodyParser from "body-parser";
import hullClient from "./middleware/client";
import CSVStream from "csv-stream";
import JSONStream from "JSONStream";
import request from "request";
import { group } from "./trait";

function fetchStream({ groupTraits, batchSize }, callback) {
  return function stream(req, res) {
    const { format, url } = req.body;
    const { client, ship } = req.hull;
    if (!url) return Promise.reject(new Error("Missing URL"));
    const notifications = [];
    const decoder = format === "csv" ? CSVStream.createStream({ escapeChar: "\"", enclosedChar: "\"" }) : JSONStream.parse();


    client.get("segments", { limit: 500 }).then((list) => {
      // Fetch all segments from Hull;
      const segments = list.reduce((ss, s) => {
        ss[s.id] = s;
        return ss;
      }, {});

      // Fetch all segments from Hull;
      function getSegments(ids = []) {
        return ids.map(id => segments[id]);
      }


      let processed = 0;

      // Batch
      const flush = (user) => {
        if (user) {
          processed += 1;
          const u = _.omit(user, "segment_ids");
          notifications.push({
            message: {
              user: groupTraits ? group(u) : u,
              segments: getSegments(user.segment_ids),
              events: []
            }
          });
        }
        if (notifications.length >= batchSize || !user) {
          callback(notifications.splice(0), { req, ship, hull: client, processed });
        }
      };

      return request({ url })
        .pipe(decoder)
        .on("data", flush)
        .on("end", flush);
    });

    return res.end("thanks !");
  };
}

module.exports = function BatchHandler(Client, { handler, hostSecret, groupTraits = false, batchSize = 500 }) {
  const app = connect();

  app.use(bodyParser.json());
  app.use(hullClient(Client, { hostSecret, fetchShip: true, cacheShip: true }));
  app.use(fetchStream({ groupTraits, batchSize }, handler));

  return function batch(req, res) {
    return app.handle(req, res);
  };
};
