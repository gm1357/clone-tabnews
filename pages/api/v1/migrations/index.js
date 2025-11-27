import migrationsRunner from "node-pg-migrate";
import { request } from "node:http";
import { join } from "node:path";

export default async function migrations(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(404).send();
  }

  const defaultOptions = {
    databaseUrl: process.env.DATABASE_URL,
    dryRun: true,
    dir: join("infra", "migrations"),
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
}
