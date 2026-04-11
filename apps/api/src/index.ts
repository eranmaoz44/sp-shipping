import "dotenv/config";
import cors from "@fastify/cors";
import Fastify from "fastify";
import { env } from "./config/env.js";
import { createAuthGuards } from "./middleware/auth.js";
import { registerAdminRoutes } from "./routes/admin-routes.js";
import { registerAuthRoutes } from "./routes/auth-routes.js";
import { registerPublicRoutes } from "./routes/public-routes.js";
import { createAuth0ManagementApiService } from "./services/auth0-management.js";

const app = Fastify({ logger: true });

app.register(cors, {
  origin: env.frontendOrigin,
  methods: ["GET", "POST", "PATCH", "OPTIONS"],
  allowedHeaders: ["Authorization", "Content-Type"],
});

const authGuards = createAuthGuards({
  auth0Domain: env.auth0Domain,
  auth0Audience: env.auth0Audience,
  auth0ManagementApiAudience: env.auth0ManagementApiAudience,
  ...(env.auth0ManagementApiClientId
    ? { auth0ManagementApiClientId: env.auth0ManagementApiClientId }
    : {}),
  ...(env.auth0ManagementApiClientSecret
    ? { auth0ManagementApiClientSecret: env.auth0ManagementApiClientSecret }
    : {}),
});

const auth0ManagementApiService = createAuth0ManagementApiService({
  auth0Domain: env.auth0Domain,
  audience: env.auth0ManagementApiAudience,
  ...(env.auth0ManagementApiClientId
    ? { clientId: env.auth0ManagementApiClientId }
    : {}),
  ...(env.auth0ManagementApiClientSecret
    ? { clientSecret: env.auth0ManagementApiClientSecret }
    : {}),
});

registerPublicRoutes(app);
registerAuthRoutes(app, authGuards);
registerAdminRoutes(app, authGuards, auth0ManagementApiService);

app.listen({ port: env.port, host: "0.0.0.0" });
