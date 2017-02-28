/**
 * File configuring the worker application of the HullApp
 */
export default function Worker({ app }) {
  const worker = app.worker({
    fetchAll: req => {
      const { lastTime } = req.payload;
      const { service } = req.hull;

      return service.getRecentUsers(users => {
        return service.sendUsers(users);
      });
    }
  });

  return worker;
}
