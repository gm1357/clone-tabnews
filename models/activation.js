import database from "infra/database";
import email from "infra/email";
import { UnauthorizedError } from "infra/errors";
import webserver from "infra/webserver";
import user from "./user";

const EXPIRATION_IN_MILLISECONDS = 15 * 60 * 1000;

async function findOneValidById(id) {
  const activationToken = await runSelectQuery(id);

  return activationToken;

  async function runSelectQuery(id) {
    const results = await database.query({
      text: `
        SELECT
          *
        FROM
          user_activation_tokens
        WHERE
          id = $1
          AND expires_at > NOW()
          AND used_at IS NULL
        LIMIT
          1
      ;`,
      values: [id],
    });

    if (results.rowCount === 0) {
      throw new UnauthorizedError({
        message: "Invalid or expired activation token",
        action: "Verify if the token still valid and try again",
      });
    }

    return results.rows[0];
  }
}

async function create(userId) {
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILLISECONDS);

  const newToken = await runInsertQuery(userId, expiresAt);
  return newToken;

  async function runInsertQuery(userId, expiresAt) {
    const results = await database.query({
      text: `
        INSERT INTO
          user_activation_tokens (user_id, expires_at)
        VALUES
          ($1, $2)
        RETURNING
          *
      ;`,
      values: [userId, expiresAt],
    });

    return results.rows[0];
  }
}

async function sendEmailToUser(user, activationToken) {
  await email.send({
    from: "CloneTabNews <contact@clonetab.com>",
    to: user.email,
    subject: "Activate your account on Clone Tabnews!",
    text: `${user.username}, click on the link below to activate your account.

${webserver.origin}/signup/activate/${activationToken.id}

Thanks!
Team CloneTabNews.
    `,
  });
}

async function markTokenAsUsed(id) {
  const activationToken = await runUpdateQuery(id);

  return activationToken;

  async function runUpdateQuery(id) {
    const results = await database.query({
      text: `
        UPDATE
          user_activation_tokens
        SET
          used_at = timezone('utc', now()),
          updated_at = timezone('utc', now())
        WHERE
          id = $1
        RETURNING
          *
      ;`,
      values: [id],
    });

    if (results.rowCount === 0) {
      throw new UnauthorizedError({
        message: "Invalid or expired activation token",
        action: "Verify if the token still valid and try again",
      });
    }

    return results.rows[0];
  }
}

async function activateUserById(userId) {
  const activatedUser = await user.setFeatures(userId, [
    "create:session",
    "read:session",
  ]);
  return activatedUser;
}

const activation = {
  create,
  sendEmailToUser,
  findOneValidById,
  markTokenAsUsed,
  activateUserById,
};

export default activation;
