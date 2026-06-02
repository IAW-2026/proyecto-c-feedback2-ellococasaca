export const APP_ROLES = ["buyer", "seller", "moderator", "admin"] as const;

export type AppRole = (typeof APP_ROLES)[number];

export type AppPublicMetadata = {
  roles?: AppRole[] | string[] | AppRole | string;
  role?: AppRole | string;
};

export function isAppRole(role: string): role is AppRole {
  return (APP_ROLES as readonly string[]).includes(role);
}

export function normalizeRoles(value: unknown): AppRole[] {
  if (Array.isArray(value)) {
    return value.filter((role): role is AppRole => typeof role === "string" && isAppRole(role));
  }

  if (typeof value === "string") {
    return isAppRole(value) ? [value] : [];
  }

  if (value && typeof value === "object") {
    const metadata = value as AppPublicMetadata;
    const fromRoles = normalizeRoles(metadata.roles);
    const fromRole = normalizeRoles(metadata.role);
    return Array.from(new Set([...fromRoles, ...fromRole]));
  }

  return [];
}

export function hasRole(roles: readonly AppRole[] | undefined, role: AppRole) {
  return roles?.includes(role) ?? false;
}