import { createRouter } from "next-connect";
import controller from "infra/controller";
import user from "models/user.js";
import activation from "models/activation";

const router = createRouter();

router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(req, res) {
  const userInputValues = req.body;
  const createdUser = await user.create(userInputValues);

  const activationToken = await activation.create(createdUser.id);
  await activation.sendEmailToUser(createdUser, activationToken);

  return res.status(201).json(createdUser);
}
