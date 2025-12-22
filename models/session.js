import crypto from "node:crypto";
import database from "infra/database";
import { UnauthorizedError } from "infra/errors";

const EXPIRATION_IN_DAYS = 30;
const EXPIRATION_IN_MILLISECONDS = 1000 * 60 * 60 * 24 * EXPIRATION_IN_DAYS;

async function create(userId) {
  const token = crypto.randomBytes(48).toString("hex");
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILLISECONDS);

  const newSession = await runInsertQuery(token, userId, expiresAt);
  return newSession;

  async function runInsertQuery(token, userId, expiresAt) {
    const results = await database.query({
      text: `
        INSERT INTO
          sessions (token, user_id, expires_at)
        VALUES
          ($1, $2, $3)
        RETURNING
          *
      ;`,
      values: [token, userId, expiresAt],
    });

    return results.rows[0];
  }
}

async function findOneValidByToken(sessionToken) {
  const sessionFound = await runSelectQuery(sessionToken);

  return sessionFound;

  async function runSelectQuery(sessionToken) {
    const results = await database.query({
      text: `
        SELECT
          *
        FROM
          sessions
        WHERE
          token = $1
          AND expires_at > NOW()
        LIMIT
          1
      ;`,
      values: [sessionToken],
    });

    if (results.rowCount === 0) {
      throw new UnauthorizedError({
        message: "User does not have an active session",
        action: "Verify if the user is logged in and try again",
      });
    }

    return results.rows[0];
  }
}

async function renewal(id) {
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILLISECONDS);

  const renewedSessionObject = runUpdateQuery(id, expiresAt);
  return renewedSessionObject;

  async function runUpdateQuery(id, expiresAt) {
    const results = await database.query({
      text: `
        UPDATE
          sessions
        SET
          expires_at = $1,
          updated_at = timezone('utc', now())
        WHERE
          id = $2
        RETURNING
          *
      ;`,
      values: [expiresAt, id],
    });

    return results.rows[0];
  }
}

const session = {
  create,
  findOneValidByToken,
  renewal,
  EXPIRATION_IN_MILLISECONDS,
};

export default session;
