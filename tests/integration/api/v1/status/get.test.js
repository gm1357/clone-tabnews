import webserver from "infra/webserver";
import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/status", () => {
  describe("Anonymous user", () => {
    test("Retrieving current system status", async () => {
      const res = await fetch(`${webserver.origin}/api/v1/status`);
      const responseBody = await res.json();

      expect(res.status).toBe(200);
      expect(responseBody.updated_at).toBeDefined();
      expect(responseBody.dependencies.database.max_connections).toBeDefined();
      expect(
        responseBody.dependencies.database.opened_connections,
      ).toBeDefined();

      const parsedDate = new Date(responseBody.updated_at).toISOString();
      expect(responseBody.updated_at).toEqual(parsedDate);

      expect(
        responseBody.dependencies.database.max_connections,
      ).toBeGreaterThan(0);
      expect(responseBody.dependencies.database.opened_connections).toEqual(1);
    });
  });

  describe("Privileged user", () => {
    test("With `read:status:all`", async () => {
      const createdUser = await orchestrator.createUser();
      const activatedUser = await orchestrator.activateUser(createdUser);
      await orchestrator.addFeaturesToUser(activatedUser, ["read:status:all"]);
      const session = await orchestrator.createSession(activatedUser);

      const res = await fetch(`${webserver.origin}/api/v1/status`, {
        headers: {
          Cookie: `session_id=${session.token}`,
        },
      });
      const responseBody = await res.json();

      expect(res.status).toBe(200);
      expect(responseBody.updated_at).toBeDefined();
      expect(responseBody.dependencies.database.version).toBeDefined();
      expect(responseBody.dependencies.database.max_connections).toBeDefined();
      expect(
        responseBody.dependencies.database.opened_connections,
      ).toBeDefined();

      const parsedDate = new Date(responseBody.updated_at).toISOString();
      expect(responseBody.updated_at).toEqual(parsedDate);

      expect(responseBody.dependencies.database.version).toMatch(/\d+\.\d+/);
      expect(
        responseBody.dependencies.database.max_connections,
      ).toBeGreaterThan(0);
      expect(responseBody.dependencies.database.opened_connections).toEqual(1);
    });
  });
});
