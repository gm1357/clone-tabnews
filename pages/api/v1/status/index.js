import { createRouter } from "next-connect";
import database from "infra/database.js";
import controller from "infra/controller";
import authorization from "models/authorization";

export default createRouter()
  .use(controller.injectAnonymousOrUser)
  .get(getHandler)
  .handler(controller.errorHandlers);

async function getHandler(req, res) {
  const userTryingToGet = req.context.user;
  const updatedAt = new Date().toISOString();

  const svResult = await database.query("SHOW server_version;");
  const dbVersion = svResult.rows[0].server_version;

  const mcResult = await database.query("SHOW max_connections;");
  const dbMaxConnections = Number(mcResult.rows[0].max_connections);

  const ocResult = await database.query({
    text: "SELECT count(*)::int FROM pg_stat_activity WHERE datname = $1;",
    values: [process.env.POSTGRES_DB],
  });
  const dbOpenedConnections = ocResult.rows[0].count;

  const statusObject = {
    updated_at: updatedAt,
    dependencies: {
      database: {
        max_connections: dbMaxConnections,
        opened_connections: dbOpenedConnections,
        version: dbVersion,
      },
    },
  };

  const secureOutputValues = authorization.filterOutput(
    userTryingToGet,
    "read:status",
    statusObject,
  );

  return res.status(200).json(secureOutputValues);
}
