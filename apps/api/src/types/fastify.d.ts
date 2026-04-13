import type { JWTPayload } from "jose";
import type { AuthenticatedActor } from "../authz.js";

declare module "fastify" {
  interface FastifyRequest {
    auth?: JWTPayload;
    actor?: AuthenticatedActor;
  }
}
