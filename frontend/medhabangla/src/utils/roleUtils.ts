export type AccessRole = "ban" | "pro" | "lite" | "user" | "enterprise";

const CHAT_ALLOWED_ROLES: AccessRole[] = ["pro", "lite", "enterprise"];

export interface RoleAwareUser {
  role?: string | null;
  is_banned?: boolean;
  ban_reason?: string | null;
  is_admin?: boolean;
  is_teacher?: boolean;
  is_member?: boolean;
}

const ACCESS_ROLE_LABELS: Record<AccessRole, string> = {
  ban: "Ban",
  pro: "Pro",
  lite: "Lite",
  user: "User",
  enterprise: "Enterprise",
};

export const isUserBanned = (
  user: RoleAwareUser | null | undefined,
): boolean => {
  if (!user) {
    return false;
  }

  return user.role === "ban" || user.is_banned === true;
};

export const getBanReason = (
  user: RoleAwareUser | null | undefined,
  fallback = "No reason provided",
): string => {
  const reason = user?.ban_reason;
  if (!reason || !reason.trim()) {
    return fallback;
  }

  return reason;
};

export const getAccessRoleLabel = (
  role: string | null | undefined,
  fallback = "User",
): string => {
  if (!role) {
    return fallback;
  }

  const normalized = role.toLowerCase() as AccessRole;
  return ACCESS_ROLE_LABELS[normalized] || fallback;
};

export const getPrimaryRoleLabel = (
  user: RoleAwareUser | null | undefined,
): string => {
  if (!user) {
    return "User";
  }

  if (user.role) {
    return getAccessRoleLabel(user.role, "User");
  }

  if (user.is_admin) {
    return "Admin";
  }

  if (user.is_teacher) {
    return "Teacher";
  }

  return "Student";
};

export const canAccessChat = (
  user: RoleAwareUser | null | undefined,
): boolean => {
  if (!user || isUserBanned(user)) {
    return false;
  }

  if (!user.role) {
    // Backward compatibility for stale localStorage payloads.
    return user.is_member === true;
  }

  const normalized = user.role.toLowerCase() as AccessRole;
  return CHAT_ALLOWED_ROLES.includes(normalized);
};
