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

describe("GET /api/user", () => {
  describe("Anonymous user", () => {
    test("Retrieving the endpoint", async () => {
      const res = await fetch(`${webserver.origin}/api/v1/user`);
      const resBody = await res.json();

      expect(res.status).toBe(403);
      expect(resBody).toEqual({
        action: 'Check if your user has the feature "read:session"',
        message: "You don't have permission to execute this action",
        name: "ForbiddenError",
        status_code: 403,
      });
    });
  });

  describe("Default user", () => {
    test("With valid session", async () => {
      const createdUser = await orchestrator.createUser({
        username: "UserWithValidSession",
      });
      const activatedUser = await orchestrator.activateUser(createdUser);

      const createdSession = await orchestrator.createSession(createdUser);

      const res = await fetch(`${webserver.origin}/api/v1/user`, {
        headers: {
          Cookie: `session_id=${createdSession.token}`,
        },
      });

      expect(res.status).toBe(200);

      const cacheControl = res.headers.get("Cache-Control");
      expect(cacheControl).toEqual(
        "no-store, no-cache, max-age=0, must-revalidate",
      );

      const resBody = await res.json();

      expect(resBody).toEqual({
        id: createdUser.id,
        username: createdUser.username,
        email: createdUser.email,
        features: ["create:session", "read:session", "update:user"],
        created_at: createdUser.created_at.toISOString(),
        updated_at: activatedUser.updated_at.toISOString(),
      });

      expect(uuidVersion(resBody.id)).toBe(4);
      expect(Date.parse(resBody.created_at)).not.toBeNaN();
      expect(Date.parse(resBody.updated_at)).not.toBeNaN();

      // Session renewal assertions
      const renewedSessionObject = await session.findOneValidByToken(
        createdSession.token,
      );

      expect(renewedSessionObject.expires_at > createdSession.expires_at).toBe(
        true,
      );
      expect(renewedSessionObject.updated_at > createdSession.updated_at).toBe(
        true,
      );

      // Set-Cookie assertions
      const parsedSetCookie = setCookieParser(res, { map: true });

      expect(parsedSetCookie.session_id).toEqual({
        name: "session_id",
        value: createdSession.token,
        maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
        path: "/",
        httpOnly: true,
      });
    });

    test("With nonexistent session", async () => {
      const nonexistentToken =
        "711dce300994443102330d27afddc74d6a4f7da1336bba0c661a9f154a808b99dea7ef15f4124dcd4aa97c7031d4d630";

      const res = await fetch(`${webserver.origin}/api/v1/user`, {
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

      // Set-Cookie assertions
      const parsedSetCookie = setCookieParser(res, {
        map: true,
      });

      expect(parsedSetCookie.session_id).toEqual({
        name: "session_id",
        value: "invalid",
        maxAge: -1,
        path: "/",
        httpOnly: true,
      });
    });

    test("With expired session", async () => {
      jest.useFakeTimers({
        now: new Date(Date.now() - session.EXPIRATION_IN_MILLISECONDS),
      });

      const createdUser = await orchestrator.createUser({
        username: "UserWithExpiredSession",
      });

      const createdSession = await orchestrator.createSession(createdUser);

      jest.useRealTimers();

      const res = await fetch(`${webserver.origin}/api/v1/user`, {
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

      // Set-Cookie assertions
      const parsedSetCookie = setCookieParser(res, {
        map: true,
      });

      expect(parsedSetCookie.session_id).toEqual({
        name: "session_id",
        value: "invalid",
        maxAge: -1,
        path: "/",
        httpOnly: true,
      });
    });
  });
});
