import Fastify, { type FastifyReply, type FastifyRequest } from "fastify";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import type { AppPermission, AuthenticatedActor } from "../authz.js";
import { createAuthGuards } from "../middleware/auth.js";
import { registerAuthRoutes } from "./auth-routes.js";

type AuthMode = "authorized" | "forbidden" | "unauthorized";

const createAuthorizedActor = (): AuthenticatedActor => ({
  sub: "auth0|auth-routes-test-user",
  email: "auth-routes-test-user@example.com",
  roles: ["admin"],
  permissions: ["users:read", "users:assign_roles", "settings:read", "settings:write"],
  token: { sub: "auth0|auth-routes-test-user" },
});

const hasPermission = (actor: AuthenticatedActor, permission: AppPermission): boolean => {
  if (actor.roles.includes("super_admin")) {
    return true;
  }
  return actor.permissions.includes(permission);
};

const createTestAuthGuards = (
  getMode: () => AuthMode,
): ReturnType<typeof createAuthGuards> => ({
  requireAuthentication: async (request: FastifyRequest) => {
    const mode = getMode();
    if (mode === "unauthorized") {
      throw new Error("Unauthorized");
    }
    request.actor = createAuthorizedActor();
  },
  requirePermission: (permission: AppPermission) => async (request: FastifyRequest) => {
    const mode = getMode();
    if (mode === "unauthorized") {
      throw new Error("Unauthorized");
    }

    const actor =
      mode === "forbidden"
        ? { ...createAuthorizedActor(), permissions: [] }
        : createAuthorizedActor();

    request.actor = actor;

    if (!hasPermission(actor, permission)) {
      throw new Error("Forbidden");
    }
  },
  sendAuthError: (reply: FastifyReply, error: unknown) => {
    const message = error instanceof Error ? error.message : "Unauthorized";
    if (message === "Forbidden") {
      return reply.status(403).send({ error: "Forbidden" });
    }
    return reply.status(401).send({ error: "Unauthorized" });
  },
});

describe("auth routes API tests", () => {
  const app = Fastify();
  let authMode: AuthMode = "authorized";

  beforeAll(async () => {
    registerAuthRoutes(app, createTestAuthGuards(() => authMode));
    await app.ready();
  });

  beforeEach(() => {
    authMode = "authorized";
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /api/protected returns actor when authenticated", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/protected",
    });

    expect(response.statusCode).toBe(200);
    const body = response.json<{ message?: string; actor?: { sub?: string } }>();
    expect(body.message).toBe("Protected endpoint reached successfully.");
    expect(body.actor?.sub).toBe("auth0|auth-routes-test-user");
  });

  it("GET /api/auth/me returns current actor profile", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/auth/me",
    });

    expect(response.statusCode).toBe(200);
    const body = response.json<{
      sub?: string;
      email?: string;
      roles?: string[];
      permissions?: string[];
    }>();

    expect(body.sub).toBe("auth0|auth-routes-test-user");
    expect(body.email).toBe("auth-routes-test-user@example.com");
    expect(body.roles).toContain("admin");
    expect(body.permissions).toContain("settings:read");
  });

  it("GET /api/settings/access returns access payload with permissions", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/settings/access",
    });

    expect(response.statusCode).toBe(200);
    const body = response.json<{
      message?: string;
      actor?: { sub?: string; permissions?: string[] };
    }>();
    expect(body.message).toBe("Access settings available.");
    expect(body.actor?.sub).toBe("auth0|auth-routes-test-user");
    expect(body.actor?.permissions).toContain("settings:read");
  });

  it("GET /api/settings/access returns 403 when permission is missing", async () => {
    authMode = "forbidden";

    const response = await app.inject({
      method: "GET",
      url: "/api/settings/access",
    });

    expect(response.statusCode).toBe(403);
    expect(response.json<{ error?: string }>().error).toBe("Forbidden");
  });

  it("GET /api/protected returns 401 when unauthorized", async () => {
    authMode = "unauthorized";

    const response = await app.inject({
      method: "GET",
      url: "/api/protected",
    });

    expect(response.statusCode).toBe(401);
    expect(response.json<{ error?: string }>().error).toBe("Unauthorized");
  });
});
