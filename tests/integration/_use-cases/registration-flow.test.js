import webserver from "infra/webserver";
import activation from "models/activation";
import user from "models/user";
import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  await orchestrator.deleteAllEmails();
});

describe("Use case: Registration Flow (all successful)", () => {
  let createdUser;
  let activationToken;
  let session;
  const TEST_USER_USERNAME = "registration_test";
  const TEST_USER_EMAIL = "registration_test@email.com";
  const TEST_USER_PASSWORD = "pass123";

  test("Create user account", async () => {
    const res = await fetch("http://localhost:3000/api/v1/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: TEST_USER_USERNAME,
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
      }),
    });
    createdUser = await res.json();

    expect(res.status).toBe(201);
    expect(createdUser).toEqual({
      username: TEST_USER_USERNAME,
      email: TEST_USER_EMAIL,
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
    expect(lastEmail.text).toContain(TEST_USER_USERNAME);

    activationToken = orchestrator.extractUUID4(lastEmail.text);

    expect(lastEmail.text).toContain(
      `${webserver.origin}/signup/activate/${activationToken}`,
    );

    const validToken = await activation.findOneValidById(activationToken);

    expect(validToken.user_id).toEqual(createdUser.id);
    expect(validToken.used_at).toBe(null);
  });

  test("Activate account", async () => {
    const activateResponse = await fetch(
      `${webserver.origin}/api/v1/activations/${activationToken}`,
      {
        method: "PATCH",
      },
    );

    expect(activateResponse.status).toBe(200);

    const responseBody = await activateResponse.json();

    expect(Date.parse(responseBody.used_at)).not.toBeNaN();

    const activatedUser = await user.findOneByUsername(TEST_USER_USERNAME);
    expect(activatedUser.features).toEqual([
      "create:session",
      "read:session",
      "update:user",
    ]);
  });

  test("Login", async () => {
    const createSessionsResponse = await fetch(
      `${webserver.origin}/api/v1/sessions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: TEST_USER_EMAIL,
          password: TEST_USER_PASSWORD,
        }),
      },
    );

    expect(createSessionsResponse.status).toBe(201);

    session = await createSessionsResponse.json();

    expect(session.user_id).toEqual(createdUser.id);
  });

  test("Get user information", async () => {
    const res = await fetch(`${webserver.origin}/api/v1/user`, {
      headers: {
        Cookie: `session_id=${session.token}`,
      },
    });
    const responseBody = await res.json();

    expect(res.status).toBe(200);
    expect(responseBody).toEqual({
      ...createdUser,
      features: ["create:session", "read:session", "update:user"],
      created_at: createdUser.created_at,
      updated_at: responseBody.updated_at,
    });
  });
});
