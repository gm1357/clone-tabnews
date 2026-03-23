import webserver from "infra/webserver";
import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/users/[username]", () => {
  describe("Anonymous user", () => {
    test("With exact case match", async () => {
      const username = "same_case";

      const createdUser = await orchestrator.createUser({
        username,
        email: "test@email.com",
        password: "pass123",
      });

      const res = await fetch(`${webserver.origin}/api/v1/users/${username}`);
      const responseBody = await res.json();

      expect(res.status).toBe(200);
      expect(responseBody).toEqual({
        id: responseBody.id,
        username,
        features: ["read:activation_token"],
        created_at: createdUser.created_at.toISOString(),
        updated_at: createdUser.updated_at.toISOString(),
      });
    });

    test("With case mismatch", async () => {
      const username = "MismatchCase";

      const createdUser = await orchestrator.createUser({
        username,
        email: "test2@email.com",
        password: "pass123",
      });

      const res = await fetch(
        `${webserver.origin}/api/v1/users/${username.toLowerCase()}`,
      );
      const responseBody = await res.json();

      expect(res.status).toBe(200);
      expect(responseBody).toEqual({
        id: responseBody.id,
        username,
        features: ["read:activation_token"],
        created_at: createdUser.created_at.toISOString(),
        updated_at: createdUser.updated_at.toISOString(),
      });
    });

    test("With nonexistent username", async () => {
      const res = await fetch(
        `${webserver.origin}/api/v1/users/NonexistentUser`,
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
  });
});
