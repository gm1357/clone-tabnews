import orchestrator from "tests/orchestrator";
import { version as uuidVersion } from "uuid";
import user from "models/user.js";
import password from "models/password";
import webserver from "infra/webserver";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/users", () => {
  describe("Anonymous user", () => {
    test("With unique an valid data", async () => {
      const usernameForTest = "test_user";
      const passwordForTest = "pass123";
      const newUser = {
        username: usernameForTest,
        email: "test@email.com",
        password: passwordForTest,
      };

      const res = await fetch(`${webserver.origin}/api/v1/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newUser),
      });
      const responseBody = await res.json();

      expect(res.status).toBe(201);
      expect(responseBody).toEqual({
        username: newUser.username,
        id: responseBody.id,
        features: ["read:activation_token"],
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      const userInDatabase = await user.findOneByUsername(usernameForTest);
      const correctPasswordMatch = await password.compare(
        passwordForTest,
        userInDatabase.password,
      );
      const incorrectPasswordMatch = await password.compare(
        "incorrect_pass",
        userInDatabase.password,
      );

      expect(correctPasswordMatch).toBe(true);
      expect(incorrectPasswordMatch).toBe(false);
    });

    test("With duplicated email", async () => {
      const newUser = {
        username: "test_user_for_dup",
        email: "test_dup@email.com",
        password: "pass123",
      };
      const dupEmailUser = {
        ...newUser,
        username: "test_user_dup",
        // Same email but with only the first letter capitalized
        email: newUser.email[0].toUpperCase() + newUser.email.slice(1),
      };

      const res1 = await fetch(`${webserver.origin}/api/v1/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newUser),
      });

      expect(res1.status).toBe(201);

      const res2 = await fetch(`${webserver.origin}/api/v1/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dupEmailUser),
      });
      const responseBody2 = await res2.json();

      expect(res2.status).toBe(400);
      expect(responseBody2).toEqual({
        name: "ValidationError",
        message: "This email is already being used.",
        action: "Use another email for this operation.",
        status_code: 400,
      });
    });

    test("With duplicated username", async () => {
      const newUser = {
        username: "test_user_dup",
        email: "test_dup1@email.com",
        password: "pass123",
      };
      const dupUsernameUser = {
        ...newUser,
        email: "test_dup2@email.com",
        // Same username but with only the first letter capitalized
        username: newUser.username[0].toUpperCase() + newUser.username.slice(1),
      };

      const res1 = await fetch(`${webserver.origin}/api/v1/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newUser),
      });

      expect(res1.status).toBe(201);

      const res2 = await fetch(`${webserver.origin}/api/v1/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dupUsernameUser),
      });
      const responseBody2 = await res2.json();

      expect(res2.status).toBe(400);
      expect(responseBody2).toEqual({
        name: "ValidationError",
        message: "This username is already being used.",
        action: "Use another username for this operation.",
        status_code: 400,
      });
    });
  });

  describe("Default user", () => {
    test("With unique and valid data", async () => {
      const user1 = await orchestrator.createUser();
      await orchestrator.activateUser(user1);
      const user1Session = await orchestrator.createSession(user1);

      const res = await fetch(`${webserver.origin}/api/v1/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${user1Session.token}`,
        },
        body: JSON.stringify({
          username: "loggedinuser",
          email: "loggedinuser@email.com",
          password: "pass123",
        }),
      });
      const responseBody = await res.json();

      expect(res.status).toBe(403);
      expect(responseBody).toEqual({
        action: 'Check if your user has the feature "create:user"',
        message: "You don't have permission to execute this action",
        name: "ForbiddenError",
        status_code: 403,
      });
    });
  });
});
