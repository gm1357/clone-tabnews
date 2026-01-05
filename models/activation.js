import database from "infra/database";
import email from "infra/email";
import { NotFoundError } from "infra/errors";
import webserver from "infra/webserver";

const EXPIRATION_IN_MILLISECONDS = 15 * 60 * 1000;

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

async function findOneByUserId(user_id) {
  const userFound = runSelectQuery(user_id);

  return userFound;

  async function runSelectQuery(user_id) {
    const results = await database.query({
      text: `
        SELECT
          *
        FROM
          user_activation_tokens
        WHERE
          user_id = $1
        LIMIT
          1
        ;`,
      values: [user_id],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "This user id was not found in the system.",
        action: "Verify if the user id was typed correctly.",
      });
    }

    return results.rows[0];
  }
}

const activation = {
  create,
  sendEmailToUser,
  findOneByUserId,
};

export default activation;
