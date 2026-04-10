import type { FastifyReply, FastifyRequest } from "fastify";
import {
  createRemoteJWKSet,
  jwtVerify,
  errors as JoseErrors,
} from "jose";
import {
  APP_ROLES,
  can,
  type AppPermission,
  type AppRole,
  rolePermissions,
  resolveActor,
} from "../authz.js";
import { prisma } from "../db.js";

type AuthGuardsOptions = {
  auth0Domain: string;
  auth0Audience: string;
};

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const isKnownRole = (value: string): value is AppRole => {
  return (APP_ROLES as readonly string[]).includes(value);
};

export const createAuthGuards = ({ auth0Domain, auth0Audience }: AuthGuardsOptions) => {
  const issuer = `https://${auth0Domain}/`;
  const auth0BaseUrl = `https://${auth0Domain}`;
  const jwks = createRemoteJWKSet(new URL(`${issuer}.well-known/jwks.json`));

  const resolveEmailFromUserInfo = async (
    accessToken: string,
  ): Promise<string | undefined> => {
    const response = await fetch(`${auth0BaseUrl}/userinfo`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      return undefined;
    }

    const data = (await response.json()) as { email?: string };
    if (!data.email || data.email.length === 0) {
      return undefined;
    }

    return data.email;
  };

  const authenticate = async (request: FastifyRequest) => {
    const authorization = request.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      throw new JoseErrors.JWTInvalid("Missing or invalid bearer token");
    }

    const token = authorization.slice("Bearer ".length).trim();
    if (!token) {
      throw new JoseErrors.JWTInvalid("Missing bearer token");
    }

    const { payload } = await jwtVerify(token, jwks, {
      issuer,
      audience: auth0Audience,
    });

    request.auth = payload;
    let actor = resolveActor(payload);

    if (!actor.email) {
      const email = await resolveEmailFromUserInfo(token);
      if (email) {
        actor = resolveActor({ ...payload, email });
      }
    }

    const normalizedEmail = actor.email ? normalizeEmail(actor.email) : undefined;
    const dbUser = await prisma.user.findFirst({
      where: {
        OR: [
          { auth0Sub: actor.sub },
          ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
        ],
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!dbUser || !dbUser.isActive) {
      throw new Error("Forbidden");
    }

    const needsAuth0SubSync = !dbUser.auth0Sub;
    const needsEmailSync = normalizedEmail && dbUser.email !== normalizedEmail;

    if (needsAuth0SubSync || needsEmailSync) {
      await prisma.user.update({
        where: { id: dbUser.id },
        data: {
          auth0Sub: dbUser.auth0Sub ?? actor.sub,
          ...(normalizedEmail ? { email: normalizedEmail } : {}),
        },
      });
    }

    const dbRoles = dbUser.roles
      .map((userRole: { role: { key: string } }) => userRole.role.key)
      .filter((role: string): role is AppRole => isKnownRole(role));

    request.actor = {
      ...actor,
      ...(normalizedEmail ? { email: normalizedEmail } : {}),
      roles: dbRoles,
      permissions: rolePermissions(dbRoles),
    };
  };

  const requireAuthentication = async (request: FastifyRequest) => {
    await authenticate(request);
  };

  const requirePermission = (permission: AppPermission) => {
    return async (request: FastifyRequest) => {
      await authenticate(request);

      const actor = request.actor;
      if (!actor || !can(actor, permission)) {
        throw new Error("Forbidden");
      }
    };
  };

  const sendAuthError = (reply: FastifyReply, error: unknown) => {
    const message = error instanceof Error ? error.message : "Unauthorized";
    if (message === "Forbidden") {
      return reply.status(403).send({ error: "Forbidden" });
    }
    return reply.status(401).send({ error: "Unauthorized" });
  };

  return {
    requireAuthentication,
    requirePermission,
    sendAuthError,
  };
};
