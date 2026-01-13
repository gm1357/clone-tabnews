import orchestrator from "tests/orchestrator";
import { version as uuidVersion } from "uuid";
import user from "models/user.js";
import password from "models/password";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/users/[username]", () => {
  describe("Anonymous user", () => {
    test("With unique username", async () => {
      const createdUser = await orchestrator.createUser({
        username: "anonymousUniqueUser",
      });

      const patchRes = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: `${createdUser.username}2`,
          }),
        },
      );
      const patchResponseBody = await patchRes.json();

      expect(patchRes.status).toBe(403);
      expect(patchResponseBody).toEqual({
        action: 'Check if your user has the feature "update:user"',
        message: "You don't have permission to execute this action",
        name: "ForbiddenError",
        status_code: 403,
      });
    });
  });

  describe("Default user", () => {
    test("With nonexistent username", async () => {
      const createdUser = await orchestrator.createUser();
      const activatedUser = await orchestrator.activateUser(createdUser);
      const sessionObject = await orchestrator.createSession(activatedUser.id);

      const res = await fetch(
        "http://localhost:3000/api/v1/users/NonexistentUser",
        {
          method: "PATCH",
          headers: {
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      );
      const responseBody = await res.json();

      expect(res.status).toBe(404);
      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "This username was not found in the system.",
        action: "Verify if the username was typed correctly.",
        status_code: 404,
      });
    });

    test("With duplicated username", async () => {
      const user1 = {
        username: "user1",
      };
      await orchestrator.createUser(user1);

      const user2 = {
        username: "user2",
      };

      const createdUser2 = await orchestrator.createUser(user2);
      const activatedUser2 = await orchestrator.activateUser(createdUser2);
      const sessionObject2 = await orchestrator.createSession(
        activatedUser2.id,
      );

      const patchRes = await fetch(
        `http://localhost:3000/api/v1/users/${user2.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject2.token}`,
          },
          body: JSON.stringify({
            username: user1.username,
          }),
        },
      );
      const patchResponseBody = await patchRes.json();

      expect(patchRes.status).toBe(400);
      expect(patchResponseBody).toEqual({
        name: "ValidationError",
        message: "This username is already being used.",
        action: "Use another username for this operation.",
        status_code: 400,
      });
    });

    test("With duplicated email", async () => {
      const email1 = {
        email: "email1@email.com",
      };
      await orchestrator.createUser(email1);

      const email2 = {
        email: "email2@email.com",
      };
      const createdUser2 = await orchestrator.createUser(email2);
      const activatedUser2 = await orchestrator.activateUser(createdUser2);
      const sessionObject2 = await orchestrator.createSession(
        activatedUser2.id,
      );

      const patchRes = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser2.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject2.token}`,
          },
          body: JSON.stringify({
            email: email1.email,
          }),
        },
      );
      const patchResponseBody = await patchRes.json();

      expect(patchRes.status).toBe(400);
      expect(patchResponseBody).toEqual({
        name: "ValidationError",
        message: "This email is already being used.",
        action: "Use another email for this operation.",
        status_code: 400,
      });
    });

    test("With unique username", async () => {
      const createdUser = await orchestrator.createUser({
        username: "uniqueUser",
      });
      const activatedUser = await orchestrator.activateUser(createdUser);
      const sessionObject = await orchestrator.createSession(activatedUser.id);

      const patchRes = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            username: `${createdUser.username}2`,
          }),
        },
      );
      const patchResponseBody = await patchRes.json();

      expect(patchRes.status).toBe(200);
      expect(patchResponseBody).toEqual({
        ...activatedUser,
        username: `${createdUser.username}2`,
        id: patchResponseBody.id,
        password: patchResponseBody.password,
        created_at: patchResponseBody.created_at,
        updated_at: patchResponseBody.updated_at,
      });

      expect(uuidVersion(patchResponseBody.id)).toBe(4);
      expect(Date.parse(patchResponseBody.created_at)).not.toBeNaN();
      expect(Date.parse(patchResponseBody.updated_at)).not.toBeNaN();
      expect(
        Date.parse(patchResponseBody.updated_at) >
          Date.parse(createdUser.updated_at),
      ).toBe(true);
    });

    test("With unique email", async () => {
      const createdUser = await orchestrator.createUser({
        email: "uniqueEmail@email.com",
      });
      const activatedUser = await orchestrator.activateUser(createdUser);
      const sessionObject = await orchestrator.createSession(activatedUser.id);

      const patchRes = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            email: `${createdUser.email}2`,
          }),
        },
      );
      const patchResponseBody = await patchRes.json();

      expect(patchRes.status).toBe(200);
      expect(patchResponseBody).toEqual({
        ...activatedUser,
        email: `${createdUser.email}2`,
        id: patchResponseBody.id,
        password: patchResponseBody.password,
        created_at: patchResponseBody.created_at,
        updated_at: patchResponseBody.updated_at,
      });

      expect(uuidVersion(patchResponseBody.id)).toBe(4);
      expect(Date.parse(patchResponseBody.created_at)).not.toBeNaN();
      expect(Date.parse(patchResponseBody.updated_at)).not.toBeNaN();
      expect(
        Date.parse(patchResponseBody.updated_at) >
          Date.parse(createdUser.updated_at),
      ).toBe(true);
    });

    test("With new password", async () => {
      const oldPassword = "oldPassword";
      const newPassword = "newPassword";

      const createdUser = await orchestrator.createUser({
        password: oldPassword,
      });
      const activatedUser = await orchestrator.activateUser(createdUser);
      const sessionObject = await orchestrator.createSession(activatedUser.id);

      const patchRes = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            password: newPassword,
          }),
        },
      );
      const patchResponseBody = await patchRes.json();

      expect(patchRes.status).toBe(200);
      expect(patchResponseBody).toEqual({
        ...activatedUser,
        id: patchResponseBody.id,
        password: patchResponseBody.password,
        created_at: patchResponseBody.created_at,
        updated_at: patchResponseBody.updated_at,
      });

      expect(uuidVersion(patchResponseBody.id)).toBe(4);
      expect(Date.parse(patchResponseBody.created_at)).not.toBeNaN();
      expect(Date.parse(patchResponseBody.updated_at)).not.toBeNaN();
      expect(
        Date.parse(patchResponseBody.updated_at) >
          Date.parse(createdUser.updated_at),
      ).toBe(true);

      const userInDatabase = await user.findOneByUsername(createdUser.username);
      const correctPasswordMatch = await password.compare(
        newPassword,
        userInDatabase.password,
      );
      const incorrectPasswordMatch = await password.compare(
        oldPassword,
        userInDatabase.password,
      );

      expect(correctPasswordMatch).toBe(true);
      expect(incorrectPasswordMatch).toBe(false);
    });
  });
});
