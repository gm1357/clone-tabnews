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
      const newUser = {
        username,
        email: "test@email.com",
        password: "pass123",
      };

      const postRes = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newUser),
      });
      const createdUser = await postRes.json();

      const res = await fetch(`http://localhost:3000/api/v1/users/${username}`);
      const responseBody = await res.json();

      expect(res.status).toBe(200);
      expect(responseBody).toEqual(createdUser);
    });

    test("With case mismatch", async () => {
      const username = "MismatchCase";
      const newUser = {
        username,
        email: "test2@email.com",
        password: "pass123",
      };

      const postRes = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newUser),
      });
      const createdUser = await postRes.json();

      const res = await fetch(
        `http://localhost:3000/api/v1/users/${username.toLowerCase()}`,
      );
      const responseBody = await res.json();

      expect(res.status).toBe(200);
      expect(responseBody).toEqual(createdUser);
    });

    test("With nonexistent username", async () => {
      const res = await fetch(
        "http://localhost:3000/api/v1/users/NonexistentUser",
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
