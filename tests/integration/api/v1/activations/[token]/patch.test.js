import webserver from "infra/webserver";
import activation from "models/activation";
import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("PATCH /api/v1/activations/[token]", () => {
  describe("Anonymous user", () => {
    test("With nonexistent token", async () => {
      const res = await fetch(
        `${webserver.origin}/api/v1/activations/95bb65e8-aca9-42aa-b258-827cbe9114d7`,
        {
          method: "PATCH",
        },
      );
      const resBody = await res.json();

      expect(res.status).toBe(401);
      expect(resBody).toEqual({
        action: "Verify if the token still valid and try again",
        message: "Invalid or expired activation token",
        name: "UnauthorizedError",
        status_code: 401,
      });
    });

    test("With expired token", async () => {
      jest.useFakeTimers({
        now: new Date(Date.now() - activation.EXPIRATION_IN_MILLISECONDS),
      });

      const createdUser = await orchestrator.createUser();
      const expiredToken = await activation.create(createdUser.id);

      jest.useRealTimers();

      const res = await fetch(
        `${webserver.origin}/api/v1/activations/${expiredToken.id}`,
        {
          method: "PATCH",
        },
      );
      const resBody = await res.json();

      expect(res.status).toBe(401);
      expect(resBody).toEqual({
        action: "Verify if the token still valid and try again",
        message: "Invalid or expired activation token",
        name: "UnauthorizedError",
        status_code: 401,
      });
    });

    test("With already used token", async () => {
      const createdUser = await orchestrator.createUser();
      const activationToken = await activation.create(createdUser.id);

      const res = await fetch(
        `${webserver.origin}/api/v1/activations/${activationToken.id}`,
        {
          method: "PATCH",
        },
      );

      expect(res.status).toBe(200);

      const res2 = await fetch(
        `${webserver.origin}/api/v1/activations/${activationToken.id}`,
        {
          method: "PATCH",
        },
      );

      expect(res2.status).toBe(401);
    });

    test("With valid token", async () => {
      const createdUser = await orchestrator.createUser();
      const activationToken = await activation.create(createdUser.id);

      const res = await fetch(
        `${webserver.origin}/api/v1/activations/${activationToken.id}`,
        {
          method: "PATCH",
        },
      );
      const resBody = await res.json();

      expect(res.status).toBe(200);
      expect(resBody).toEqual({
        ...activationToken,
        created_at: activationToken.created_at.toISOString(),
        expires_at: activationToken.expires_at.toISOString(),
        updated_at: resBody.updated_at,
        used_at: resBody.used_at,
      });
      expect(Date.parse(resBody.used_at)).not.toBeNaN();
    });

    test("With valid token but already activated user", async () => {
      const createdUser = await orchestrator.createUser();
      await orchestrator.activateUser(createdUser);
      const activationToken = await activation.create(createdUser.id);

      const res = await fetch(
        `${webserver.origin}/api/v1/activations/${activationToken.id}`,
        {
          method: "PATCH",
        },
      );
      const resBody = await res.json();

      expect(res.status).toBe(403);
      expect(resBody).toEqual({
        action: "Contact support for more information.",
        message: "You cannot use activation tokens.",
        name: "ForbiddenError",
        status_code: 403,
      });
    });
  });

  describe("Default user", () => {
    test("With valid token but already logged in user", async () => {
      const user1 = await orchestrator.createUser();
      await orchestrator.activateUser(user1);
      const user1Session = await orchestrator.createSession(user1.id);

      const user2 = await orchestrator.createUser();
      const user2ActivationToken = await activation.create(user2.id);

      const res = await fetch(
        `${webserver.origin}/api/v1/activations/${user2ActivationToken.id}`,
        {
          method: "PATCH",
          headers: {
            cookie: `session_id=${user1Session.token}`,
          },
        },
      );
      const resBody = await res.json();

      expect(res.status).toBe(403);
      expect(resBody).toEqual({
        action: 'Check if your user has the feature "read:activation_token"',
        message: "You don't have permission to execute this action",
        name: "ForbiddenError",
        status_code: 403,
      });
    });
  });
});
