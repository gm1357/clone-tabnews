import migrationsRunner from "node-pg-migrate";
import { request } from "node:http";
import { join } from "node:path";
import database from "infra/database";

export default async function migrations(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(404).send();
  }

  const dbClient = await database.getNewClient();

  const defaultOptions = {
    dbClient,
    dryRun: true,
    dir: join("infra", "migrations"),
    direction: "up",
    verbose: true,
    migrationsTable: "pgmigrations",
  };

  if (req.method === "GET") {
    const pendingMigrations = await migrationsRunner(defaultOptions);
    await dbClient.end();
    return res.status(200).json(pendingMigrations);
  }

  const createdMigrations = await migrationsRunner({
    ...defaultOptions,
    dryRun: false,
  });
  await dbClient.end();

  const statusCode = !createdMigrations.length ? 200 : 201;

  return res.status(statusCode).json(createdMigrations);
}
