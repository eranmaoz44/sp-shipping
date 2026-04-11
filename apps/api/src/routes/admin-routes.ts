import type { FastifyInstance } from "fastify";
import { APP_ROLES, type AppRole } from "../authz.js";
import { prisma } from "../db.js";
import type { createAuthGuards } from "../middleware/auth.js";
import type {
  ManagementApiUsersResponse,
  createAuth0ManagementApiService,
} from "../services/auth0-management.js";
import { getEmailLookupVariants, normalizeEmail } from "../utils/email.js";

type AuthGuards = ReturnType<typeof createAuthGuards>;
type Auth0ManagementApiService = ReturnType<typeof createAuth0ManagementApiService>;
type UserWithRoles = {
  id: string;
  email: string | null;
  auth0Sub: string | null;
  isActive: boolean;
  createdAt: Date;
  roles: { role: { key: string } }[];
};

const isKnownRole = (value: string): value is AppRole => {
  return (APP_ROLES as readonly string[]).includes(value);
};

const mapUserResponse = (user: UserWithRoles) => ({
  id: user.id,
  email: user.email,
  auth0Sub: user.auth0Sub,
  isActive: user.isActive,
  roles: user.roles.map((item: { role: { key: string } }) => item.role.key),
  createdAt: user.createdAt,
});

const getUserByIdWithRoles = (userId: string) => {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: {
        include: {
          role: true,
        },
      },
    },
  });
};

export const registerAdminRoutes = (
  app: FastifyInstance,
  authGuards: AuthGuards,
  auth0ManagementApiService: Auth0ManagementApiService,
) => {
  const { requirePermission, sendAuthError } = authGuards;
  const { listAuth0Users, getAuth0UserByEmail } = auth0ManagementApiService;

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

      const auth0User = await getAuth0UserByEmail(email);
      const auth0Sub = auth0User?.user_id ?? null;
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: getEmailLookupVariants(email).map((variant) => ({ email: variant })),
        },
        orderBy: { createdAt: "asc" },
      });

      const user = existingUser
        ? await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              email,
              isActive: true,
              ...(auth0Sub ? { auth0Sub } : {}),
            },
          })
        : await prisma.user.create({
            data: {
              email,
              isActive: true,
              ...(auth0Sub ? { auth0Sub } : {}),
            },
          });

      await prisma.$transaction(async (transaction) => {
        await transaction.userRole.deleteMany({
          where: { userId: user.id },
        });

        await transaction.userRole.create({
          data: {
            userId: user.id,
            roleId: dbRole.id,
            assignedBy: request.actor?.sub ?? null,
          },
        });
      });

      const userWithRoles = await getUserByIdWithRoles(user.id);

      return {
        user: {
          ...(userWithRoles ? mapUserResponse(userWithRoles as UserWithRoles) : {}),
        },
      };
    },
  );

  app.patch(
    "/api/admin/users/:userId/role",
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
      const params = request.params as { userId?: string };
      const body = request.body as { role?: unknown };
      const userId = typeof params.userId === "string" ? params.userId : "";
      const role = typeof body.role === "string" ? body.role : "";

      if (!userId || !isKnownRole(role)) {
        return reply.status(400).send({ error: "userId and valid role are required" });
      }

      const targetUser = await getUserByIdWithRoles(userId);
      if (!targetUser) {
        return reply.status(404).send({ error: "User not found" });
      }

      const actor = request.actor;
      const actorEmailVariants = actor?.email ? getEmailLookupVariants(actor.email) : [];
      const targetEmailVariants = targetUser.email
        ? getEmailLookupVariants(targetUser.email)
        : [];
      const isSelfAction =
        (actor?.sub && targetUser.auth0Sub === actor.sub) ||
        actorEmailVariants.some((variant) => targetEmailVariants.includes(variant));

      if (isSelfAction) {
        return reply.status(400).send({ error: "You cannot edit your own role" });
      }

      const dbRole = await prisma.role.findUnique({
        where: { key: role },
      });
      if (!dbRole) {
        return reply.status(400).send({ error: "Role does not exist. Run seed first." });
      }

      await prisma.$transaction(async (transaction) => {
        await transaction.userRole.deleteMany({
          where: { userId: targetUser.id },
        });
        await transaction.userRole.create({
          data: {
            userId: targetUser.id,
            roleId: dbRole.id,
            assignedBy: request.actor?.sub ?? null,
          },
        });
      });

      const updatedUser = await getUserByIdWithRoles(targetUser.id);

      return {
        user: updatedUser ? mapUserResponse(updatedUser as UserWithRoles) : null,
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
        users: users.map((user) => mapUserResponse(user as UserWithRoles)),
        total: users.length,
      };
    },
  );
};
