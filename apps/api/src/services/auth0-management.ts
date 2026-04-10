type Auth0ManagementApiServiceOptions = {
  auth0Domain: string;
  audience: string;
  clientId?: string;
  clientSecret?: string;
};

export type ManagementApiUsersResponse = {
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

export const createAuth0ManagementApiService = ({
  auth0Domain,
  audience,
  clientId,
  clientSecret,
}: Auth0ManagementApiServiceOptions) => {
  const auth0BaseUrl = `https://${auth0Domain}`;
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

    if (!clientId || !clientSecret) {
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
        client_id: clientId,
        client_secret: clientSecret,
        audience,
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

  return {
    listAuth0Users,
  };
};
