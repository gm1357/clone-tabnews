import database from "infra/database";
import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await database.query("drop schema public cascade; create schema public");
});

test("GET /api/migrations returns status ok", async () => {
  const res = await fetch("http://localhost:3000/api/v1/migrations");
  expect(res.status).toBe(200);

  const responseBody = await res.json();

  expect(Array.isArray(responseBody)).toBe(true);
  expect(responseBody.length).toBeGreaterThan(0);
});
