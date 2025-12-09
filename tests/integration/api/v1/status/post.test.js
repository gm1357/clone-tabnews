import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

describe("POST /api/status", () => {
  describe("Anonymous user", () => {
    test("Trying a different HTTP method that is not allowed", async () => {
      const res = await fetch("http://localhost:3000/api/v1/status", {
        method: "POST",
      });
      const responseBody = await res.json();

      expect(res.status).toBe(405);

      expect(responseBody).toEqual({
        name: "MethodNotAllowedError",
        message: "This method is not allowed for this endpoint.",
        action: "Verify if this HTTP method is valid for this endpoint.",
        status_code: 405,
      });
    });
  });
});
