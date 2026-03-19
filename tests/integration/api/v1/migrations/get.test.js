import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/migrations", () => {
  describe("Anonymous user", () => {
    test("Retrieving pending migrations", async () => {
      const res = await fetch("http://localhost:3000/api/v1/migrations");
      expect(res.status).toBe(403);

      const responseBody = await res.json();

      expect(responseBody).toEqual({
        action: 'Check if your user has the feature "read:migration"',
        message: "You don't have permission to execute this action",
        name: "ForbiddenError",
        status_code: 403,
      });
    });
  });

  describe("Default user", () => {
    test("Retrieving pending migrations", async () => {
      const createdUser = await orchestrator.createUser();
      const activatedUser = await orchestrator.activateUser(createdUser);
      const session = await orchestrator.createSession(activatedUser.id);

      const res = await fetch("http://localhost:3000/api/v1/migrations", {
        headers: {
          Cookie: `session_id=${session.token}`,
        },
      });
      expect(res.status).toBe(403);

      const responseBody = await res.json();

      expect(responseBody).toEqual({
        action: 'Check if your user has the feature "read:migration"',
        message: "You don't have permission to execute this action",
        name: "ForbiddenError",
        status_code: 403,
      });
    });
  });

  describe("Privileged user", () => {
    test("Retrieving pending migrations", async () => {
      const createdUser = await orchestrator.createUser();
      const activatedUser = await orchestrator.activateUser(createdUser);
      await orchestrator.addFeaturesToUser(activatedUser, ["read:migration"]);
      const session = await orchestrator.createSession(activatedUser.id);

      const res = await fetch("http://localhost:3000/api/v1/migrations", {
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
