import type { FastifyInstance } from "fastify";

export const registerPublicRoutes = (app: FastifyInstance) => {
  app.get("/", async () => {
    return { hello: "world" };
  });

  app.get("/api/public", async () => {
    return { message: "Public endpoint is reachable." };
  });
};
