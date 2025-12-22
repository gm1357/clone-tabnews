import { createRouter } from "next-connect";
import controller from "infra/controller";
import { listPendingMigrations, runPendingMigrations } from "models/migrator";

const router = createRouter();

router.get(getHandler);
router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(req, res) {
  const pendingMigrations = await listPendingMigrations();
  return res.status(200).json(pendingMigrations);
}

async function postHandler(req, res) {
  const createdMigrations = await runPendingMigrations();

  const statusCode = !createdMigrations.length ? 200 : 201;
  return res.status(statusCode).json(createdMigrations);
}
