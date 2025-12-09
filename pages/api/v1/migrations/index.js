import migrationsRunner from "node-pg-migrate";
import { resolve } from "node:path";
import database from "infra/database";
import { createRouter } from "next-connect";
import { errorHandlers } from "infra/controller";

const router = createRouter();

router.get(getHandler);
router.post(postHandler);

export default router.handler(errorHandlers);

const DEFAULT_MIGRATIONS_OPTIONS = {
  dryRun: true,
  dir: resolve("infra", "migrations"),
  direction: "up",
  verbose: true,
  migrationsTable: "pgmigrations",
};

async function getHandler(req, res) {
  const dbClient = await database.getNewClient();

  try {
    const pendingMigrations = await migrationsRunner({
      ...DEFAULT_MIGRATIONS_OPTIONS,
      dbClient,
    });
    return res.status(200).json(pendingMigrations);
  } finally {
    await dbClient.end();
  }
}

async function postHandler(req, res) {
  const dbClient = await database.getNewClient();

  try {
    const createdMigrations = await migrationsRunner({
      ...DEFAULT_MIGRATIONS_OPTIONS,
      dbClient,
      dryRun: false,
    });

    const statusCode = !createdMigrations.length ? 200 : 201;

    return res.status(statusCode).json(createdMigrations);
  } finally {
    await dbClient.end();
  }
}
