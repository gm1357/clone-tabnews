import webserver from "infra/webserver";
import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/migrations", () => {
  describe("Anonymous user", () => {
    test("Running pending migrations", async () => {
      const res1 = await fetch(`${webserver.origin}/api/v1/migrations`, {
        method: "POST",
      });
      expect(res1.status).toBe(403);

      const responseBody1 = await res1.json();

      expect(responseBody1).toEqual({
        action: 'Check if your user has the feature "create:migration"',
        message: "You don't have permission to execute this action",
        name: "ForbiddenError",
        status_code: 403,
      });
    });
  });

  describe("Default user", () => {
    test("Running pending migrations", async () => {
      const createdUser = await orchestrator.createUser();
      const activatedUser = await orchestrator.activateUser(createdUser);
      const session = await orchestrator.createSession(activatedUser.id);

      const res = await fetch(`${webserver.origin}/api/v1/migrations`, {
        method: "POST",
        headers: {
          Cookie: `session_id=${session.token}`,
        },
      });
      expect(res.status).toBe(403);

      const responseBody = await res.json();

      expect(responseBody).toEqual({
        action: 'Check if your user has the feature "create:migration"',
        message: "You don't have permission to execute this action",
        name: "ForbiddenError",
        status_code: 403,
      });
    });
  });

  describe("Privileged user", () => {
    test("Running pending migrations", async () => {
      const createdUser = await orchestrator.createUser();
      const activatedUser = await orchestrator.activateUser(createdUser);
      await orchestrator.addFeaturesToUser(activatedUser, ["create:migration"]);
      const session = await orchestrator.createSession(activatedUser.id);

      const res = await fetch(`${webserver.origin}/api/v1/migrations`, {
        method: "POST",
        headers: {
          Cookie: `session_id=${session.token}`,
        },
      });
      expect(res.status).toBe(200);

      const responseBody = await res.json();

      expect(Array.isArray(responseBody)).toBe(true);
    });
  });
});
