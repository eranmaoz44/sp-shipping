import type { FastifyInstance } from "fastify";
import { APP_ROLES, type AppRole } from "../authz.js";
import { prisma } from "../db.js";
import type { createAuthGuards } from "../middleware/auth.js";
import type {
  ManagementApiUsersResponse,
  createAuth0ManagementApiService,
} from "../services/auth0-management.js";

type AuthGuards = ReturnType<typeof createAuthGuards>;
type Auth0ManagementApiService = ReturnType<typeof createAuth0ManagementApiService>;

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const isKnownRole = (value: string): value is AppRole => {
  return (APP_ROLES as readonly string[]).includes(value);
};

export const registerAdminRoutes = (
  app: FastifyInstance,
  authGuards: AuthGuards,
  auth0ManagementApiService: Auth0ManagementApiService,
) => {
  const { requirePermission, sendAuthError } = authGuards;
  const { listAuth0Users } = auth0ManagementApiService;

  app.get(
    "/api/admin/auth0-users",
    {
      preHandler: async (request, reply) => {
        try {
          await requirePermission("users:read")(request);
        } catch (error) {
          return sendAuthError(reply, error);
        }
      },
    },
    async (_request, reply) => {
      try {
        const data = await listAuth0Users();
        return {
          users: data.users.map((user: ManagementApiUsersResponse["users"][number]) => ({
            id: user.user_id,
            email: user.email,
            name: user.name ?? user.nickname,
            picture: user.picture,
            lastLogin: user.last_login,
            loginCount: user.logins_count,
          })),
          total: data.total,
        };
      } catch (error) {
        app.log.error(error);
        return reply
          .status(502)
          .send({ error: "Failed to list Auth0 users from Management API" });
      }
    },
  );

  app.post(
    "/api/admin/users",
    {
      preHandler: async (request, reply) => {
        try {
          await requirePermission("users:assign_roles")(request);
        } catch (error) {
          return sendAuthError(reply, error);
        }
      },
    },
    async (request, reply) => {
      const body = request.body as { email?: unknown; role?: unknown };
      const email = typeof body.email === "string" ? normalizeEmail(body.email) : "";
      const role = typeof body.role === "string" ? body.role : "";

      if (!email || !isKnownRole(role)) {
        return reply.status(400).send({ error: "email and valid role are required" });
      }

      const dbRole = await prisma.role.findUnique({
        where: { key: role },
      });

      if (!dbRole) {
        return reply.status(400).send({ error: "Role does not exist. Run seed first." });
      }

      const user = await prisma.user.upsert({
        where: { email },
        update: {
          isActive: true,
        },
        create: {
          email,
          isActive: true,
        },
      });

      await prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: user.id,
            roleId: dbRole.id,
          },
        },
        update: {},
        create: {
          userId: user.id,
          roleId: dbRole.id,
          assignedBy: request.actor?.sub ?? null,
        },
      });

      const userWithRoles = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });

      return {
        user: {
          id: userWithRoles?.id,
          email: userWithRoles?.email,
          isActive: userWithRoles?.isActive,
          roles:
            userWithRoles?.roles.map((item: { role: { key: string } }) => item.role.key) ??
            [],
        },
      };
    },
  );

  app.get(
    "/api/admin/users",
    {
      preHandler: async (request, reply) => {
        try {
          await requirePermission("users:read")(request);
        } catch (error) {
          return sendAuthError(reply, error);
        }
      },
    },
    async () => {
      const users = await prisma.user.findMany({
        orderBy: { createdAt: "asc" },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });

      return {
        users: users.map(
          (user: {
            id: string;
            email: string | null;
            auth0Sub: string | null;
            isActive: boolean;
            createdAt: Date;
            roles: { role: { key: string } }[];
          }) => ({
            id: user.id,
            email: user.email,
            auth0Sub: user.auth0Sub,
            isActive: user.isActive,
            roles: user.roles.map((item: { role: { key: string } }) => item.role.key),
            createdAt: user.createdAt,
          }),
        ),
        total: users.length,
      };
    },
  );
};
