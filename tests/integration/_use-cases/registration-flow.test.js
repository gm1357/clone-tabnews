import webserver from "infra/webserver";
import activation from "models/activation";
import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  await orchestrator.deleteAllEmails();
});

describe("Use case: Registration Flow (all successful)", () => {
  let createdUser;

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
    createdUser = await res.json();

    expect(res.status).toBe(201);
    expect(createdUser).toEqual({
      username: "registration_test",
      email: "registration_test@email.com",
      id: createdUser.id,
      password: createdUser.password,
      features: ["read:activation_token"],
      created_at: createdUser.created_at,
      updated_at: createdUser.updated_at,
    });
  });

  test("Receive activation email", async () => {
    const lastEmail = await orchestrator.getLastEmail();

    expect(lastEmail.sender).toBe("<contact@clonetab.com>");
    expect(lastEmail.recipients[0]).toBe("<registration_test@email.com>");
    expect(lastEmail.subject).toBe("Activate your account on Clone Tabnews!");
    expect(lastEmail.text).toContain("registration_test");

    const activationToken = orchestrator.extractUUID4(lastEmail.text);

    expect(lastEmail.text).toContain(
      `${webserver.origin}/signup/activate/${activationToken}`,
    );

    const validToken = await activation.findOneValidById(activationToken);

    expect(validToken.user_id).toEqual(createdUser.id);
    expect(validToken.used_at).toBe(null);
  });

  test("Activate account", async () => {});

  test("Login", async () => {});

  test("Get user information", async () => {});
});
