import migrationsRunner from "node-pg-migrate";
import { resolve } from "node:path";
import database from "infra/database";

const DEFAULT_MIGRATIONS_OPTIONS = {
  dryRun: true,
  dir: resolve("infra", "migrations"),
  direction: "up",
  verbose: true,
  migrationsTable: "pgmigrations",
};

export async function listPendingMigrations() {
  const dbClient = await database.getNewClient();

  try {
    const pendingMigrations = await migrationsRunner({
      ...DEFAULT_MIGRATIONS_OPTIONS,
      dbClient,
    });

    return pendingMigrations;
  } finally {
    await dbClient.end();
  }
}

export async function runPendingMigrations() {
  const dbClient = await database.getNewClient();

  try {
    const createdMigrations = await migrationsRunner({
      ...DEFAULT_MIGRATIONS_OPTIONS,
      dbClient,
      dryRun: false,
    });

    return createdMigrations;
  } finally {
    await dbClient.end();
  }
}
