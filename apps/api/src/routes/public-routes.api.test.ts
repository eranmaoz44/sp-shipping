import Fastify from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import { registerPublicRoutes } from "./public-routes.js";

describe("public routes API tests", () => {
  const app = Fastify();

  beforeAll(async () => {
    registerPublicRoutes(app);
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET / returns hello world payload", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json<{ hello?: string }>().hello).toBe("world");
  });

  it("GET /api/public returns public endpoint message", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/public",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json<{ message?: string }>().message).toBe("Public endpoint is reachable.");
  });
});
