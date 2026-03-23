import session from "models/session";
import orchestrator from "tests/orchestrator";
import { version as uuidVersion } from "uuid";
import setCookieParser from "set-cookie-parser";
import webserver from "infra/webserver";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("DELETE /api/v1/sessions", () => {
  describe("Default user", () => {
    test("With nonexistent session", async () => {
      const nonexistentToken =
        "711dce300994443102330d27afddc74d6a4f7da1336bba0c661a9f154a808b99dea7ef15f4124dcd4aa97c7031d4d630";

      const res = await fetch(`${webserver.origin}/api/v1/sessions`, {
        method: "DELETE",
        headers: {
          Cookie: `session_id=${nonexistentToken}`,
        },
      });

      expect(res.status).toBe(401);

      const resBody = await res.json();

      expect(resBody).toEqual({
        name: "UnauthorizedError",
        message: "User does not have an active session",
        action: "Verify if the user is logged in and try again",
        status_code: 401,
      });
    });

    test("With expired session", async () => {
      jest.useFakeTimers({
        now: new Date(Date.now() - session.EXPIRATION_IN_MILLISECONDS),
      });

      const createdUser = await orchestrator.createUser({
        username: "UserWithExpiredSession",
      });

      const createdSession = await orchestrator.createSession(createdUser.id);

      jest.useRealTimers();

      const res = await fetch(`${webserver.origin}/api/v1/sessions`, {
        method: "DELETE",
        headers: {
          Cookie: `session_id=${createdSession.token}`,
        },
      });

      expect(res.status).toBe(401);

      const resBody = await res.json();

      expect(resBody).toEqual({
        name: "UnauthorizedError",
        message: "User does not have an active session",
        action: "Verify if the user is logged in and try again",
        status_code: 401,
      });
    });

    test("With valid session", async () => {
      const createdUser = await orchestrator.createUser({
        username: "UserWithValidSession",
      });

      const createdSession = await orchestrator.createSession(createdUser.id);

      const res = await fetch(`${webserver.origin}/api/v1/sessions`, {
        method: "DELETE",
        headers: {
          Cookie: `session_id=${createdSession.token}`,
        },
      });

      expect(res.status).toBe(200);

      const resBody = await res.json();

      expect(resBody).toEqual({
        id: createdSession.id,
        token: createdSession.token,
        user_id: createdSession.user_id,
        expires_at: resBody.expires_at,
        created_at: resBody.created_at,
        updated_at: resBody.updated_at,
      });

      expect(uuidVersion(resBody.id)).toBe(4);
      expect(Date.parse(resBody.expires_at)).not.toBeNaN();
      expect(Date.parse(resBody.created_at)).not.toBeNaN();
      expect(Date.parse(resBody.updated_at)).not.toBeNaN();

      expect(resBody.expires_at < createdSession.expires_at.toISOString()).toBe(
        true,
      );
      expect(resBody.updated_at > createdSession.updated_at.toISOString()).toBe(
        true,
      );

      // Set-Cookie assertions
      const parsedSetCookie = setCookieParser(res, { map: true });

      expect(parsedSetCookie.session_id).toEqual({
        name: "session_id",
        value: "invalid",
        maxAge: -1,
        path: "/",
        httpOnly: true,
      });

      // Double check assertions
      const doubleCheckRes = await fetch(`${webserver.origin}/api/v1/user`, {
        headers: {
          Cookie: `session_id=${createdSession.token}`,
        },
      });

      expect(doubleCheckRes.status).toBe(401);
    });
  });
});
