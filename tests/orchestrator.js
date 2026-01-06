import { faker } from "@faker-js/faker/.";
import retry from "async-retry";
import database from "infra/database";
import activation from "models/activation";
import { runPendingMigrations as migratorRunPendingMigrations } from "models/migrator";
import session from "models/session";
import user from "models/user";

const EMAIL_HTTP_URL = `http://${process.env.EMAIL_HTTP_HOST}:${process.env.EMAIL_HTTP_PORT}`;

async function waitForAllServices() {
  await waitForWebServer();
  await waitForEmailServer();

  async function waitForWebServer() {
    return retry(fetchStatusPage, {
      retries: 100,
      maxTimeout: 1000,
    });

    async function fetchStatusPage() {
      const response = await fetch("http://localhost:3000/api/v1/status");

      if (!response.ok) {
        throw new Error();
      }
    }
  }

  async function waitForEmailServer() {
    return retry(fetchEmailPage, {
      retries: 100,
      maxTimeout: 1000,
    });

    async function fetchEmailPage() {
      const response = await fetch(EMAIL_HTTP_URL);

      if (!response.ok) {
        throw new Error();
      }
    }
  }
}

async function clearDatabase() {
  await database.query("drop schema public cascade; create schema public");
}

async function runPendingMigrations() {
  await migratorRunPendingMigrations();
}

async function createUser(userObject) {
  return await user.create({
    username:
      userObject.username ?? faker.internet.username().replace(/[_.-]/g, ""),
    email: userObject.email ?? faker.internet.email(),
    password: userObject.password ?? "validPass",
  });
}

async function createSession(userId) {
  return await session.create(userId);
}

async function deleteAllEmails() {
  await fetch(`${EMAIL_HTTP_URL}/messages`, {
    method: "DELETE",
  });
}

async function getLastEmail() {
  const emailListRes = await fetch(`${EMAIL_HTTP_URL}/messages`);
  const emailList = await emailListRes.json();
  const lastEmailItem = emailList.pop();

  if (!lastEmailItem) {
    return null;
  }

  const lastEmailTextRes = await fetch(
    `${EMAIL_HTTP_URL}/messages/${lastEmailItem.id}.plain`,
  );
  const emailTextBody = await lastEmailTextRes.text();

  return {
    ...lastEmailItem,
    text: emailTextBody,
  };
}

function extractUUID4(text) {
  const uuid4regex =
    /[a-f0-9]{8}-?[a-f0-9]{4}-?4[a-f0-9]{3}-?[89ab][a-f0-9]{3}-?[a-f0-9]{12}/;
  const token = text.match(uuid4regex);

  return token?.[0] ?? null;
}

async function activateUser(user) {
  return await activation.activateUserById(user.id);
}

const orchestrator = {
  waitForAllServices,
  clearDatabase,
  runPendingMigrations,
  createUser,
  createSession,
  deleteAllEmails,
  getLastEmail,
  extractUUID4,
  activateUser,
};

export default orchestrator;
