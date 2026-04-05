import "dotenv/config";
import cors from "@fastify/cors";
import Fastify, { type FastifyRequest } from "fastify";
import {
  createRemoteJWKSet,
  jwtVerify,
  type JWTPayload,
  errors as JoseErrors,
} from "jose";
import {
  can,
  type AppPermission,
  type AuthenticatedActor,
  resolveActor,
} from "./authz.js";

declare module "fastify" {
  interface FastifyRequest {
    auth?: JWTPayload;
    actor?: AuthenticatedActor;
  }
}

const auth0Domain = process.env.AUTH0_DOMAIN;
const auth0Audience = process.env.AUTH0_AUDIENCE;
const frontendOrigin = process.env.FRONTEND_ORIGIN ?? "http://localhost:5173";
const port = Number(process.env.PORT ?? "3001");
const managementApiAudience =
  process.env.AUTH0_MANAGEMENT_API_AUDIENCE ?? `https://${auth0Domain}/api/v2/`;
const managementApiClientId = process.env.AUTH0_MANAGEMENT_API_CLIENT_ID;
const managementApiClientSecret = process.env.AUTH0_MANAGEMENT_API_CLIENT_SECRET;

if (!auth0Domain || !auth0Audience) {
  throw new Error(
    "Missing AUTH0_DOMAIN or AUTH0_AUDIENCE environment variables.",
  );
}

const issuer = `https://${auth0Domain}/`;
const jwks = createRemoteJWKSet(new URL(`${issuer}.well-known/jwks.json`));
const auth0BaseUrl = `https://${auth0Domain}`;

const app = Fastify({ logger: true });

app.register(cors, {
  origin: frontendOrigin,
});

const resolveEmailFromUserInfo = async (accessToken: string): Promise<string | undefined> => {
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

  request.actor = actor;
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

type ManagementApiUsersResponse = {
  users: {
    user_id?: string;
    email?: string;
    name?: string;
    nickname?: string;
    picture?: string;
    last_login?: string;
    logins_count?: number;
  }[];
  total: number;
  page: number;
  per_page: number;
};

let cachedManagementToken:
  | {
      accessToken: string;
      expiresAt: number;
    }
  | undefined;

const getManagementApiToken = async (): Promise<string> => {
  const now = Date.now();
  if (cachedManagementToken && cachedManagementToken.expiresAt > now + 10_000) {
    return cachedManagementToken.accessToken;
  }

  if (!managementApiClientId || !managementApiClientSecret) {
    throw new Error(
      "Missing AUTH0_MANAGEMENT_API_CLIENT_ID or AUTH0_MANAGEMENT_API_CLIENT_SECRET",
    );
  }

  const tokenResponse = await fetch(`${auth0BaseUrl}/oauth/token`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: managementApiClientId,
      client_secret: managementApiClientSecret,
      audience: managementApiAudience,
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error(`Auth0 token request failed with status ${tokenResponse.status}`);
  }

  const tokenData = (await tokenResponse.json()) as {
    access_token?: string;
    expires_in?: number;
  };

  if (!tokenData.access_token || !tokenData.expires_in) {
    throw new Error("Auth0 token response missing access_token or expires_in");
  }

  cachedManagementToken = {
    accessToken: tokenData.access_token,
    expiresAt: now + tokenData.expires_in * 1000,
  };

  return cachedManagementToken.accessToken;
};

const listAuth0Users = async (): Promise<ManagementApiUsersResponse> => {
  const accessToken = await getManagementApiToken();
  const usersResponse = await fetch(
    `${auth0BaseUrl}/api/v2/users?include_totals=true&page=0&per_page=50`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!usersResponse.ok) {
    throw new Error(`Auth0 users request failed with status ${usersResponse.status}`);
  }

  return (await usersResponse.json()) as ManagementApiUsersResponse;
};

app.get("/", async () => {
  return { hello: "world" };
});

app.get("/api/public", async () => {
  return { message: "Public endpoint is reachable." };
});

app.get(
  "/api/protected",
  {
    preHandler: async (request, reply) => {
      try {
        await requireAuthentication(request);
      } catch {
        return reply.status(401).send({ error: "Unauthorized" });
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
      } catch {
        return reply.status(401).send({ error: "Unauthorized" });
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
        const message = error instanceof Error ? error.message : "Unauthorized";
        if (message === "Forbidden") {
          return reply.status(403).send({ error: "Forbidden" });
        }
        return reply.status(401).send({ error: "Unauthorized" });
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

app.post(
  "/api/settings/access/bootstrap",
  {
    preHandler: async (request, reply) => {
      try {
        await requirePermission("users:assign_roles")(request);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unauthorized";
        if (message === "Forbidden") {
          return reply.status(403).send({ error: "Forbidden" });
        }
        return reply.status(401).send({ error: "Unauthorized" });
      }
    },
  },
  async () => {
    return {
      message:
        "RBAC backend foundation is ready. Next step is persisting user role assignments.",
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
        const message = error instanceof Error ? error.message : "Unauthorized";
        if (message === "Forbidden") {
          return reply.status(403).send({ error: "Forbidden" });
        }
        return reply.status(401).send({ error: "Unauthorized" });
      }
    },
  },
  async (_request, reply) => {
    try {
      const data = await listAuth0Users();
      return {
        users: data.users.map((user) => ({
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

app.listen({ port, host: "0.0.0.0" });
