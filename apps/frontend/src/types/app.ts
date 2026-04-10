export type ActorProfile = {
  sub?: string;
  email?: string;
  roles: string[];
  permissions: string[];
};

export type AdminUser = {
  id?: string;
  email?: string;
  roles?: string[];
  isActive?: boolean;
  createdAt?: string;
};

export type ThemeMode = "light" | "dark";
export type ActiveView = "home" | "settings";
