import orchestrator from "tests/orchestrator";
import { version as uuidVersion } from "uuid";
import setCookieParser from "set-cookie-parser";
import session from "models/session";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/sessions", () => {
  describe("Anonymous user", () => {
    test("With incorrect email but correct password", async () => {
      await orchestrator.createUser({
        password: "valid-password",
      });

      const res = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "incorrect-email@test.com",
          password: "correct-password",
        }),
      });

      expect(res.status).toBe(401);

      const resBody = await res.json();

      expect(resBody).toEqual({
        name: "UnauthorizedError",
        message: "Authentication data is not valid.",
        action: "Verify if the data sent is correct.",
        status_code: 401,
      });
    });

    test("With correct email but incorrect password", async () => {
      await orchestrator.createUser({
        email: "correct.email@test.com",
        password: "password",
      });

      const res = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "correct.email@test.com",
          password: "incorrect-password",
        }),
      });

      expect(res.status).toBe(401);

      const resBody = await res.json();

      expect(resBody).toEqual({
        name: "UnauthorizedError",
        message: "Authentication data is not valid.",
        action: "Verify if the data sent is correct.",
        status_code: 401,
      });
    });

    test("With incorrect email and incorrect password", async () => {
      await orchestrator.createUser({
        email: "email@test.com",
        password: "password",
      });

      const res = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "incorrect.email@test.com",
          password: "incorrect-password",
        }),
      });

      expect(res.status).toBe(401);

      const resBody = await res.json();

      expect(resBody).toEqual({
        name: "UnauthorizedError",
        message: "Authentication data is not valid.",
        action: "Verify if the data sent is correct.",
        status_code: 401,
      });
    });

    test("With correct email and correct password", async () => {
      const createdUser = await orchestrator.createUser({
        email: "all.correct@test.com",
        password: "correct-password",
      });

      await orchestrator.activateUser(createdUser);

      const res = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "all.correct@test.com",
          password: "correct-password",
        }),
      });

      expect(res.status).toBe(201);

      const resBody = await res.json();

      expect(resBody).toEqual({
        id: resBody.id,
        token: resBody.token,
        user_id: createdUser.id,
        expires_at: resBody.expires_at,
        created_at: resBody.created_at,
        updated_at: resBody.updated_at,
      });

      expect(uuidVersion(resBody.id)).toBe(4);
      expect(Date.parse(resBody.expires_at)).not.toBeNaN();
      expect(Date.parse(resBody.created_at)).not.toBeNaN();
      expect(Date.parse(resBody.updated_at)).not.toBeNaN();

      const expiresAt = new Date(resBody.expires_at);
      const createdAt = new Date(resBody.created_at);

      expiresAt.setMilliseconds(0);
      createdAt.setMilliseconds(0);

      expect(expiresAt - createdAt).toBe(session.EXPIRATION_IN_MILLISECONDS);

      const parsedSetCookie = setCookieParser(res, { map: true });

      expect(parsedSetCookie.session_id).toEqual({
        name: "session_id",
        value: resBody.token,
        maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
        path: "/",
        httpOnly: true,
      });
    });
  });
});
