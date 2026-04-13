export type ActorProfile = {
  sub?: string;
  email?: string;
  roles: string[];
  permissions: string[];
};

export type AdminUser = {
  id?: string;
  email?: string;
  auth0Sub?: string;
  roles?: string[];
  isActive?: boolean;
  createdAt?: string;
};

export const ROLE_OPTIONS = ["viewer", "member", "admin", "super_admin"] as const;
export type AppRole = (typeof ROLE_OPTIONS)[number];

export type ThemeMode = "light" | "dark";
export type ActiveView = "home" | "settings";
