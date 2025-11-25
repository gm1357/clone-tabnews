test("GET /api/status returns status ok", async () => {
  const res = await fetch("http://localhost:3000/api/v1/status");
  const responseBody = await res.json();

  expect(res.status).toBe(200);
  expect(responseBody.updated_at).toBeDefined();
  expect(responseBody.dependencies.database.version).toBeDefined();
  expect(responseBody.dependencies.database.max_connections).toBeDefined();
  expect(responseBody.dependencies.database.opened_connections).toBeDefined();

  const parsedDate = new Date(responseBody.updated_at).toISOString();
  expect(responseBody.updated_at).toEqual(parsedDate);

  expect(responseBody.dependencies.database.version).toMatch(/\d+\.\d+/);
  expect(responseBody.dependencies.database.max_connections).toBeGreaterThan(0);
  expect(responseBody.dependencies.database.opened_connections).toEqual(1);
});
