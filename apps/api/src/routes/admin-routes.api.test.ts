import Fastify, { type FastifyReply, type FastifyRequest } from "fastify";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import type { AppPermission, AppRole, AuthenticatedActor } from "../authz.js";
import { prisma } from "../db.js";
import { createAuthGuards } from "../middleware/auth.js";
import { registerAdminRoutes } from "./admin-routes.js";
import { createAuth0ManagementApiService } from "../services/auth0-management.js";

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
const describeIfDatabase = hasDatabaseUrl ? describe : describe.skip;

const TEST_ROLE_KEYS: readonly AppRole[] = ["super_admin", "admin", "member", "viewer"];

type TestUserResponse = {
  id: string;
  email: string | null;
  auth0Sub: string | null;
  isActive: boolean;
  roles: string[];
  createdAt: string;
};

type AuthMode = "super_admin" | "viewer" | "unauthorized";

const createTestActor = (mode: Exclude<AuthMode, "unauthorized">): AuthenticatedActor => {
  if (mode === "viewer") {
    return {
      sub: "auth0|api-test-viewer",
      email: "api-test-viewer@example.com",
      roles: ["viewer"],
      permissions: [],
      token: { sub: "auth0|api-test-viewer" },
    };
  }

  return {
    sub: "auth0|api-test-admin",
    email: "api-test-admin@example.com",
    roles: ["super_admin"],
    permissions: ["users:read", "users:assign_roles", "settings:read", "settings:write"],
    token: { sub: "auth0|api-test-admin" },
  };
};

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
    request.actor = createTestActor(mode);
  },
  requirePermission: (permission: AppPermission) => async (request: FastifyRequest) => {
    const mode = getMode();
    if (mode === "unauthorized") {
      throw new Error("Unauthorized");
    }

    const actor = createTestActor(mode);
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

const createTestManagementApiService = (): ReturnType<typeof createAuth0ManagementApiService> => ({
  getAuth0UserByEmail: async (email: string) => ({
    user_id: `auth0|${email}`,
    email,
  }),
});

describeIfDatabase("admin routes API tests", () => {
  const app = Fastify();
  const createdEmails = new Set<string>();
  let authMode: AuthMode = "super_admin";

  beforeAll(async () => {
    registerAdminRoutes(
      app,
      createTestAuthGuards(() => authMode),
      createTestManagementApiService(),
    );
    await app.ready();

    for (const roleKey of TEST_ROLE_KEYS) {
      await prisma.role.upsert({
        where: { key: roleKey },
        update: {},
        create: {
          key: roleKey,
          description: `Test seeded ${roleKey}`,
        },
      });
    }
  });

  beforeEach(async () => {
    authMode = "super_admin";
    createdEmails.clear();
  });

  afterEach(async () => {
    const emails = [...createdEmails];
    if (emails.length === 0) {
      return;
    }

    await prisma.userRole.deleteMany({
      where: {
        user: {
          email: {
            in: emails,
          },
        },
      },
    });

    await prisma.user.deleteMany({
      where: {
        email: {
          in: emails,
        },
      },
    });
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it("adds user then returns it from users list", async () => {
    const email = `api-test-${Date.now()}@example.com`;
    createdEmails.add(email);

    const addResponse = await app.inject({
      method: "POST",
      url: "/api/admin/users",
      payload: {
        email,
        role: "member",
      },
    });

    expect(addResponse.statusCode).toBe(200);
    const addBody = addResponse.json<{ user?: TestUserResponse }>();
    expect(addBody.user?.email).toBe(email);
    expect(addBody.user?.roles).toContain("member");
    expect(addBody.user?.auth0Sub).toBe(`auth0|${email}`);

    const listResponse = await app.inject({
      method: "GET",
      url: "/api/admin/users",
    });

    expect(listResponse.statusCode).toBe(200);
    const listBody = listResponse.json<{ users: TestUserResponse[]; total: number }>();
    const createdUser = listBody.users.find((user) => user.email === email);

    expect(createdUser).toBeDefined();
    expect(createdUser?.roles).toContain("member");
    expect(listBody.total).toBeGreaterThan(0);
  });

  it("returns 400 when adding user with invalid payload", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/admin/users",
      payload: {
        email: "",
        role: "not-a-role",
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json<{ error?: string }>().error).toBe("email and valid role are required");
  });

  it("updates a user role via patch route", async () => {
    const email = `api-test-update-${Date.now()}@example.com`;
    createdEmails.add(email);

    const addResponse = await app.inject({
      method: "POST",
      url: "/api/admin/users",
      payload: {
        email,
        role: "member",
      },
    });

    expect(addResponse.statusCode).toBe(200);
    const addBody = addResponse.json<{ user?: TestUserResponse }>();
    const userId = addBody.user?.id;
    expect(userId).toBeDefined();

    const patchResponse = await app.inject({
      method: "PATCH",
      url: `/api/admin/users/${userId}/role`,
      payload: {
        role: "admin",
      },
    });

    expect(patchResponse.statusCode).toBe(200);
    const patchBody = patchResponse.json<{ user?: TestUserResponse }>();
    expect(patchBody.user?.roles).toContain("admin");
    expect(patchBody.user?.roles).not.toContain("member");

    const listResponse = await app.inject({
      method: "GET",
      url: "/api/admin/users",
    });
    const listBody = listResponse.json<{ users: TestUserResponse[] }>();
    const updatedUser = listBody.users.find((user) => user.id === userId);
    expect(updatedUser?.roles).toContain("admin");
  });

  it("blocks self role edit attempts", async () => {
    const email = "api-test-admin@example.com";
    createdEmails.add(email);

    const addResponse = await app.inject({
      method: "POST",
      url: "/api/admin/users",
      payload: {
        email,
        role: "member",
      },
    });

    expect(addResponse.statusCode).toBe(200);
    const userId = addResponse.json<{ user?: TestUserResponse }>().user?.id;
    expect(userId).toBeDefined();

    const patchResponse = await app.inject({
      method: "PATCH",
      url: `/api/admin/users/${userId}/role`,
      payload: {
        role: "viewer",
      },
    });

    expect(patchResponse.statusCode).toBe(400);
    expect(patchResponse.json<{ error?: string }>().error).toBe("You cannot edit your own role");
  });

  it("returns 404 when patching a non-existent user", async () => {
    const response = await app.inject({
      method: "PATCH",
      url: "/api/admin/users/cmidonotexist/role",
      payload: {
        role: "admin",
      },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json<{ error?: string }>().error).toBe("User not found");
  });

  it("returns 403 when actor lacks users:read permission", async () => {
    authMode = "viewer";

    const response = await app.inject({
      method: "GET",
      url: "/api/admin/users",
    });

    expect(response.statusCode).toBe(403);
    expect(response.json<{ error?: string }>().error).toBe("Forbidden");
  });

  it("returns 401 when actor is unauthorized", async () => {
    authMode = "unauthorized";

    const response = await app.inject({
      method: "GET",
      url: "/api/admin/users",
    });

    expect(response.statusCode).toBe(401);
    expect(response.json<{ error?: string }>().error).toBe("Unauthorized");
  });
});
