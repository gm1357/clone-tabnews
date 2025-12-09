import { createRouter } from "next-connect";
import database from "infra/database.js";
import { errorHandlers } from "infra/controller";

const router = createRouter();

router.get(getHandler);

export default router.handler(errorHandlers);

async function getHandler(req, res) {
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

  res.status(200).json({
    updated_at: updatedAt,
    dependencies: {
      database: {
        max_connections: dbMaxConnections,
        opened_connections: dbOpenedConnections,
        version: dbVersion,
      },
    },
  });
}
