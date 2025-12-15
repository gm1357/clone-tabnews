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
    test("With nonexistent username", async () => {
      const res = await fetch(
        "http://localhost:3000/api/v1/users/NonexistentUser",
        {
          method: "PATCH",
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
        email: "user1@email.com",
        password: "pass123",
      };
      const user1res = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(user1),
      });

      expect(user1res.status).toBe(201);

      const user2 = {
        username: "user2",
        email: "user2@email.com",
        password: "pass123",
      };
      const user2res = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(user2),
      });

      expect(user2res.status).toBe(201);

      const patchRes = await fetch(
        `http://localhost:3000/api/v1/users/${user2.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
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
        username: "email1",
        email: "email1@email.com",
        password: "pass123",
      };
      const email1res = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(email1),
      });

      expect(email1res.status).toBe(201);

      const email2 = {
        username: "email2",
        email: "email2@email.com",
        password: "pass123",
      };
      const email2res = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(email2),
      });

      expect(email2res.status).toBe(201);

      const patchRes = await fetch(
        `http://localhost:3000/api/v1/users/${email2.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
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
      const uniqueUser = {
        username: "uniqueUser",
        email: "uniqueUser@email.com",
        password: "pass123",
      };
      const uniqueUserRes = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(uniqueUser),
      });
      const uniqueUserResponseBody = await uniqueUserRes.json();

      expect(uniqueUserRes.status).toBe(201);

      const patchRes = await fetch(
        `http://localhost:3000/api/v1/users/${uniqueUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: `${uniqueUser.username}2`,
          }),
        },
      );
      const patchResponseBody = await patchRes.json();

      expect(patchRes.status).toBe(200);
      expect(patchResponseBody).toEqual({
        ...uniqueUser,
        username: `${uniqueUser.username}2`,
        id: patchResponseBody.id,
        password: patchResponseBody.password,
        created_at: patchResponseBody.created_at,
        updated_at: patchResponseBody.updated_at,
      });

      expect(uuidVersion(patchResponseBody.id)).toBe(4);
      expect(Date.parse(patchResponseBody.created_at)).not.toBeNaN();
      expect(Date.parse(patchResponseBody.updated_at)).not.toBeNaN();
      expect(
        patchResponseBody.updated_at > uniqueUserResponseBody.updated_at,
      ).toBe(true);
    });

    test("With unique email", async () => {
      const uniqueEmail = {
        username: "uniqueEmail",
        email: "uniqueEmail@email.com",
        password: "pass123",
      };
      const uniqueEmailRes = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(uniqueEmail),
      });
      const uniqueEmailResponseBody = await uniqueEmailRes.json();

      expect(uniqueEmailRes.status).toBe(201);

      const patchRes = await fetch(
        `http://localhost:3000/api/v1/users/${uniqueEmail.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: `${uniqueEmail.email}2`,
          }),
        },
      );
      const patchResponseBody = await patchRes.json();

      expect(patchRes.status).toBe(200);
      expect(patchResponseBody).toEqual({
        ...uniqueEmail,
        email: `${uniqueEmail.email}2`,
        id: patchResponseBody.id,
        password: patchResponseBody.password,
        created_at: patchResponseBody.created_at,
        updated_at: patchResponseBody.updated_at,
      });

      expect(uuidVersion(patchResponseBody.id)).toBe(4);
      expect(Date.parse(patchResponseBody.created_at)).not.toBeNaN();
      expect(Date.parse(patchResponseBody.updated_at)).not.toBeNaN();
      expect(
        patchResponseBody.updated_at > uniqueEmailResponseBody.updated_at,
      ).toBe(true);
    });

    test("With new password", async () => {
      const oldPassword = "oldPassword";
      const newPassword = "newPassword";

      const newPasswordUser = {
        username: "newPassword",
        email: "newPassword@email.com",
        password: oldPassword,
      };
      const newPasswordRes = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newPasswordUser),
      });
      const newPasswordResponseBody = await newPasswordRes.json();

      expect(newPasswordRes.status).toBe(201);

      const patchRes = await fetch(
        `http://localhost:3000/api/v1/users/${newPasswordUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            password: newPassword,
          }),
        },
      );
      const patchResponseBody = await patchRes.json();

      expect(patchRes.status).toBe(200);
      expect(patchResponseBody).toEqual({
        ...newPasswordUser,
        id: patchResponseBody.id,
        password: patchResponseBody.password,
        created_at: patchResponseBody.created_at,
        updated_at: patchResponseBody.updated_at,
      });

      expect(uuidVersion(patchResponseBody.id)).toBe(4);
      expect(Date.parse(patchResponseBody.created_at)).not.toBeNaN();
      expect(Date.parse(patchResponseBody.updated_at)).not.toBeNaN();
      expect(
        patchResponseBody.updated_at > newPasswordResponseBody.updated_at,
      ).toBe(true);

      const userInDatabase = await user.findOneByUsername(
        newPasswordUser.username,
      );
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
