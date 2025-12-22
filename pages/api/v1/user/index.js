import { createRouter } from "next-connect";
import controller from "infra/controller";
import user from "models/user.js";
import session from "models/session";

const router = createRouter();

router.get(getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(req, res) {
  const sessionToken = req.cookies.session_id;

  const sessionObject = await session.findOneValidByToken(sessionToken);
  await session.renewal(sessionObject.id);

  const userFound = await user.findOneById(sessionObject.user_id);
  controller.setSessionCookie(res, sessionObject.token);
  controller.forceIgnoreCache(res);

  return res.status(200).json(userFound);
}
