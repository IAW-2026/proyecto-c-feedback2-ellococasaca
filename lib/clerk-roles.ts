export const APP_ROLES = ["buyer", "seller", "moderator", "admin"] as const;

export type AppRole = (typeof APP_ROLES)[number];

export type AppPublicMetadata = {
  roles?: AppRole[];
};

export function isAppRole(role: string): role is AppRole {
  return (APP_ROLES as readonly string[]).includes(role);
}

export function normalizeRoles(value: unknown): AppRole[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((role): role is AppRole => typeof role === "string" && isAppRole(role));
}

export function hasRole(roles: readonly AppRole[] | undefined, role: AppRole) {
  return roles?.includes(role) ?? false;
}