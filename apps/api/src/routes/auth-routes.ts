import type { FastifyInstance } from "fastify";
import type { createAuthGuards } from "../middleware/auth.js";

type AuthGuards = ReturnType<typeof createAuthGuards>;

export const registerAuthRoutes = (app: FastifyInstance, authGuards: AuthGuards) => {
  const { requireAuthentication, requirePermission, sendAuthError } = authGuards;

  app.get(
    "/api/protected",
    {
      preHandler: async (request, reply) => {
        try {
          await requireAuthentication(request);
        } catch (error) {
          return sendAuthError(reply, error);
        }
      },
    },
    async (request) => {
      return {
        message: "Protected endpoint reached successfully.",
        actor: request.actor,
      };
    },
  );

  app.get(
    "/api/auth/me",
    {
      preHandler: async (request, reply) => {
        try {
          await requireAuthentication(request);
        } catch (error) {
          return sendAuthError(reply, error);
        }
      },
    },
    async (request) => {
      return {
        sub: request.actor?.sub,
        email: request.actor?.email,
        roles: request.actor?.roles ?? [],
        permissions: request.actor?.permissions ?? [],
      };
    },
  );

  app.get(
    "/api/settings/access",
    {
      preHandler: async (request, reply) => {
        try {
          await requirePermission("settings:read")(request);
        } catch (error) {
          return sendAuthError(reply, error);
        }
      },
    },
    async (request) => {
      return {
        message: "Access settings available.",
        actor: {
          sub: request.actor?.sub,
          email: request.actor?.email,
          roles: request.actor?.roles ?? [],
          permissions: request.actor?.permissions ?? [],
        },
      };
    },
  );
};
