import type { JWTPayload } from "jose";

export const APP_ROLES = ["super_admin", "admin", "member", "viewer"] as const;
export type AppRole = (typeof APP_ROLES)[number];

export const APP_PERMISSIONS = [
  "users:read",
  "users:assign_roles",
  "settings:read",
  "settings:write",
] as const;
export type AppPermission = (typeof APP_PERMISSIONS)[number];

export type AuthenticatedActor = {
  sub: string;
  email?: string;
  roles: AppRole[];
  permissions: AppPermission[];
  token: JWTPayload;
};

const ROLE_PERMISSIONS: Record<AppRole, AppPermission[]> = {
  super_admin: ["users:read", "users:assign_roles", "settings:read", "settings:write"],
  admin: ["users:read", "users:assign_roles", "settings:read", "settings:write"],
  member: [],
  viewer: [],
};

const APP_ROLE_SET = new Set<string>(APP_ROLES);
const APP_PERMISSION_SET = new Set<string>(APP_PERMISSIONS);

const readStringListClaim = (payload: JWTPayload, claimKey: string): string[] => {
  const rawValue = payload[claimKey];

  if (!Array.isArray(rawValue)) {
    return [];
  }

  return rawValue.filter((item): item is string => typeof item === "string");
};

const readFirstStringClaim = (payload: JWTPayload, claimKeys: string[]): string | undefined => {
  for (const claimKey of claimKeys) {
    const value = payload[claimKey];
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }
  return undefined;
};

const normalizeRoles = (roles: string[]): AppRole[] => {
  return roles.filter((role): role is AppRole => APP_ROLE_SET.has(role));
};

const normalizePermissions = (permissions: string[]): AppPermission[] => {
  return permissions.filter((permission): permission is AppPermission =>
    APP_PERMISSION_SET.has(permission),
  );
};

export const rolePermissions = (roles: AppRole[]): AppPermission[] => {
  const set = new Set<AppPermission>();

  for (const role of roles) {
    for (const permission of ROLE_PERMISSIONS[role]) {
      set.add(permission);
    }
  }

  return [...set];
};

const unique = <T,>(items: T[]): T[] => [...new Set(items)];

const claimsNamespace = process.env.AUTHZ_CLAIMS_NAMESPACE;

export const resolveActor = (payload: JWTPayload): AuthenticatedActor => {
  const sub = payload.sub;

  if (!sub) {
    throw new Error("Token is missing the subject claim (sub).");
  }

  const email = readFirstStringClaim(payload, [
    "email",
    claimsNamespace ? `${claimsNamespace}/email` : "",
  ]);

  const tokenRoles = normalizeRoles(
    unique([
      ...readStringListClaim(payload, "roles"),
      ...(claimsNamespace ? readStringListClaim(payload, `${claimsNamespace}/roles`) : []),
    ]),
  );

  const tokenPermissions = normalizePermissions(
    unique([
      ...readStringListClaim(payload, "permissions"),
      ...(claimsNamespace
        ? readStringListClaim(payload, `${claimsNamespace}/permissions`)
        : []),
    ]),
  );

  const roles = unique([...tokenRoles]);
  const permissions = unique([...tokenPermissions, ...rolePermissions(roles)]);

  return {
    sub,
    ...(email ? { email } : {}),
    roles,
    permissions,
    token: payload,
  };
};

export const can = (
  actor: Pick<AuthenticatedActor, "roles" | "permissions">,
  permission: AppPermission,
  _resource?: unknown,
  _context?: unknown,
): boolean => {
  if (actor.roles.includes("super_admin")) {
    return true;
  }

  return actor.permissions.includes(permission);
};
