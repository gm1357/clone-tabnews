import { InternalServerError } from "infra/errors";
import authorization from "models/authorization";

describe("models/authorization.js", () => {
  describe("can()", () => {
    test("without 'user'", () => {
      expect(() => authorization.can()).toThrow(InternalServerError);
    });

    test("without user.features", () => {
      const user = { id: 1, username: "user" };
      expect(() => authorization.can(user)).toThrow(InternalServerError);
    });

    test("with unknown feature", () => {
      const user = { features: [] };
      expect(() => authorization.can(user, "unknown")).toThrow(
        InternalServerError,
      );
    });

    test("with valid user and known feature", () => {
      const user = { features: ["create:user"] };
      expect(authorization.can(user, "create:user")).toBe(true);
    });
  });

  describe("filterOutput()", () => {
    test("without 'user'", () => {
      expect(() => authorization.filterOutput()).toThrow(InternalServerError);
    });

    test("without user.features", () => {
      const user = { id: 1, username: "user" };
      expect(() => authorization.filterOutput(user)).toThrow(
        InternalServerError,
      );
    });

    test("with unknown feature", () => {
      const user = { features: [] };
      expect(() => authorization.filterOutput(user, "unknown")).toThrow(
        InternalServerError,
      );
    });

    test("with valid user, known feature but without resource", () => {
      const user = { features: [] };
      expect(() => authorization.filterOutput(user, "read:user")).toThrow(
        InternalServerError,
      );
    });

    test("with valid user, known feature and resource", () => {
      const user = { features: [] };
      const resource = {
        id: 1,
        username: "resource",
        features: ["read:user"],
        created_at: "2026-02-05T14:54:22-03:00",
        updated_at: "2026-02-05T14:54:22-03:00",
        email: "resource@example.com",
        password: "password",
      };
      expect(authorization.filterOutput(user, "read:user", resource)).toEqual({
        id: 1,
        username: "resource",
        features: ["read:user"],
        created_at: "2026-02-05T14:54:22-03:00",
        updated_at: "2026-02-05T14:54:22-03:00",
      });
    });
  });
});
