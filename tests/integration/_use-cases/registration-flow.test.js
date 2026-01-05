import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  await orchestrator.deleteAllEmails();
});

describe("Use case: Registration Flow (all successful)", () => {
  test("Create user account", async () => {
    const res = await fetch("http://localhost:3000/api/v1/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "registration_test",
        email: "registration_test@email.com",
        password: "pass123",
      }),
    });
    const responseBody = await res.json();

    expect(res.status).toBe(201);
    expect(responseBody).toEqual({
      username: "registration_test",
      email: "registration_test@email.com",
      id: responseBody.id,
      password: responseBody.password,
      features: ["read:activation_token"],
      created_at: responseBody.created_at,
      updated_at: responseBody.updated_at,
    });
  });

  test("Receive activation email", async () => {});

  test("Activate account", async () => {});

  test("Login", async () => {});

  test("Get user information", async () => {});
});
