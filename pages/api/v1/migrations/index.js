import { createRouter } from "next-connect";
import controller from "infra/controller";
import { listPendingMigrations, runPendingMigrations } from "models/migrator";
import authorization from "models/authorization";

export default createRouter()
  .use(controller.injectAnonymousOrUser)
  .get(controller.canRequest("read:migration"), getHandler)
  .post(controller.canRequest("create:migration"), postHandler)
  .handler(controller.errorHandlers);

async function getHandler(req, res) {
  const userTryingToGet = req.context.user;
  const pendingMigrations = await listPendingMigrations();

  const secureOutputValues = authorization.filterOutput(
    userTryingToGet,
    "read:migration",
    pendingMigrations,
  );

  return res.status(200).json(secureOutputValues);
}

async function postHandler(req, res) {
  const userTryingToPost = req.context.user;
  const createdMigrations = await runPendingMigrations();

  const secureOutputValues = authorization.filterOutput(
    userTryingToPost,
    "read:migration",
    createdMigrations,
  );

  const statusCode = !createdMigrations.length ? 200 : 201;
  return res.status(statusCode).json(secureOutputValues);
}
