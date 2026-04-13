const auth0Domain = process.env.AUTH0_DOMAIN;
const auth0Audience = process.env.AUTH0_AUDIENCE;

if (!auth0Domain || !auth0Audience) {
  throw new Error("Missing AUTH0_DOMAIN or AUTH0_AUDIENCE environment variables.");
}

export const env = {
  auth0Domain,
  auth0Audience,
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? "http://localhost:5173",
  port: Number(process.env.PORT ?? "3001"),
  auth0ManagementApiAudience:
    process.env.AUTH0_MANAGEMENT_API_AUDIENCE ?? `https://${auth0Domain}/api/v2/`,
  auth0ManagementApiClientId: process.env.AUTH0_MANAGEMENT_API_CLIENT_ID,
  auth0ManagementApiClientSecret: process.env.AUTH0_MANAGEMENT_API_CLIENT_SECRET,
};
