import { createRouter } from "next-connect";
import controller from "infra/controller";
import user from "models/user.js";
import authorization from "models/authorization";
import { ForbiddenError } from "infra/errors";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);

router.get(getHandler);
router.patch(controller.canRequest("update:user"), patchHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(req, res) {
  const { username } = req.query;
  const userFound = await user.findOneByUsername(username);

  return res.status(200).json(userFound);
}

async function patchHandler(req, res) {
  const { username } = req.query;
  const userInputValues = req.body;

  const userTryingToPatch = req.context.user;
  const targetUser = await user.findOneByUsername(username);

  if (!authorization.can(userTryingToPatch, "update:user", targetUser)) {
    throw new ForbiddenError({
      message: "You don't have the required permission to update another user.",
      action:
        "Verify if you have the necessary feature to update another user.",
    });
  }

  const updatedUser = await user.update(username, userInputValues);

  return res.status(200).json(updatedUser);
}
