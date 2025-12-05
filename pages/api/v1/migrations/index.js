import migrationsRunner from "node-pg-migrate";
import { resolve } from "node:path";
import database from "infra/database";

export default async function migrations(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  const dbClient = await database.getNewClient();

  try {
    const defaultOptions = {
      dbClient,
      dryRun: true,
      dir: resolve("infra", "migrations"),
      direction: "up",
      verbose: true,
      migrationsTable: "pgmigrations",
    };

    if (req.method === "GET") {
      const pendingMigrations = await migrationsRunner(defaultOptions);
      return res.status(200).json(pendingMigrations);
    }

    const createdMigrations = await migrationsRunner({
      ...defaultOptions,
      dryRun: false,
    });

    const statusCode = !createdMigrations.length ? 200 : 201;

    return res.status(statusCode).json(createdMigrations);
  } catch (err) {
    console.error(err);
    throw err;
  } finally {
    await dbClient.end();
  }
}
