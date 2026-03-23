import { createRouter } from "next-connect";
import controller from "infra/controller";
import activation from "models/activation";
import authorization from "models/authorization";

export default createRouter()
  .use(controller.injectAnonymousOrUser)
  .patch(controller.canRequest("read:activation_token"), patchHandler)
  .handler(controller.errorHandlers);

async function patchHandler(req, res) {
  const userTryingToActivate = req.context.user;
  const tokenId = req.query.token;

  const validToken = await activation.findOneValidById(tokenId);

  await activation.activateUserById(validToken.user_id);

  const usedToken = await activation.markTokenAsUsed(validToken.id);

  const secureOutputValues = authorization.filterOutput(
    userTryingToActivate,
    "read:activation_token",
    usedToken,
  );

  return res.status(200).json(secureOutputValues);
}
