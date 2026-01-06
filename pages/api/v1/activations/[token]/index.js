import { createRouter } from "next-connect";
import controller from "infra/controller";
import activation from "models/activation";

const router = createRouter();

router.patch(patchHandler);

export default router.handler(controller.errorHandlers);

async function patchHandler(req, res) {
  const tokenId = req.query.token;

  const validToken = await activation.findOneValidById(tokenId);
  const usedToken = await activation.markTokenAsUsed(validToken.id);
  await activation.activateUserById(usedToken.user_id);

  return res.status(200).json(usedToken);
}
