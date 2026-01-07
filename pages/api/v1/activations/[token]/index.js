import { createRouter } from "next-connect";
import controller from "infra/controller";
import activation from "models/activation";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);

router.patch(controller.canRequest("read:activation_token"), patchHandler);

export default router.handler(controller.errorHandlers);

async function patchHandler(req, res) {
  const tokenId = req.query.token;

  const validToken = await activation.findOneValidById(tokenId);

  await activation.activateUserById(validToken.user_id);

  const usedToken = await activation.markTokenAsUsed(validToken.id);

  return res.status(200).json(usedToken);
}
