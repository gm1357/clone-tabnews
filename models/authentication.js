import { NotFoundError, UnauthorizedError } from "infra/errors";
import password from "./password";
import user from "./user";

async function getUser(providedEmail, providedPassword) {
  try {
    let storedUser = await findUserByEmail(providedEmail);
    await validatePassword(providedPassword, storedUser.password);

    return storedUser;
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      throw new UnauthorizedError({
        message: "Authentication data is not valid.",
        action: "Verify if the data sent is correct.",
      });
    }

    throw err;
  }

  async function findUserByEmail(providedEmail) {
    try {
      const storedUser = await user.findOneByEmail(providedEmail);
      return storedUser;
    } catch (err) {
      if (err instanceof NotFoundError) {
        throw new UnauthorizedError({
          message: "Email does not match.",
          action: "Verify if the data sent is correct.",
        });
      }

      throw err;
    }
  }

  async function validatePassword(providedPassword, storedPassword) {
    const correctPasswordMatch = await password.compare(
      providedPassword,
      storedPassword,
    );

    if (!correctPasswordMatch) {
      throw new UnauthorizedError({
        message: "Password does not match.",
        action: "Verify if the data sent is correct.",
      });
    }
  }
}

const authentication = {
  getUser,
};

export default authentication;
