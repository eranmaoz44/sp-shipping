const readRequiredEnv = (name: keyof ImportMetaEnv): string => {
  const value = import.meta.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

export const auth0Config = {
  domain: readRequiredEnv("VITE_AUTH0_DOMAIN"),
  clientId: readRequiredEnv("VITE_AUTH0_CLIENT_ID"),
  audience: readRequiredEnv("VITE_AUTH0_AUDIENCE"),
  redirectUri: import.meta.env.VITE_AUTH0_REDIRECT_URI ?? window.location.origin,
};

export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001";
