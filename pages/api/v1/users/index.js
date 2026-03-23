import { createRouter } from "next-connect";
import controller from "infra/controller";
import user from "models/user.js";
import activation from "models/activation";
import authorization from "models/authorization";

export default createRouter()
  .use(controller.injectAnonymousOrUser)
  .post(controller.canRequest("create:user"), postHandler)
  .handler(controller.errorHandlers);

async function postHandler(req, res) {
  const userTryingPost = req.context.user;
  const userInputValues = req.body;
  const createdUser = await user.create(userInputValues);

  const activationToken = await activation.create(createdUser.id);
  await activation.sendEmailToUser(createdUser, activationToken);

  const secureOutputValues = authorization.filterOutput(
    userTryingPost,
    "read:user",
    createdUser,
  );

  return res.status(201).json(secureOutputValues);
}
