import { api } from "./api";

// Role Ownership Transfer (HOD/Director/Dean) - see backend_changes_requied.md for the full
// RoleAssignment data model. scope_id conventions: Department.id for HOD, school code for
// Director, DEAN_TRACKS value ("engineering" | "non_engineering") for Dean.
const normalizeAssignment = (raw) => {
  if (!raw) return null;
  return {
    assignmentId: raw.assignment_id ?? raw.assignmentId ?? "",
    roleType: raw.role_type ?? raw.roleType ?? "",
    scopeId: raw.scope_id ?? raw.scopeId ?? "",
    email: raw.email ?? raw.user_email ?? raw.userEmail ?? "",
    fullName: raw.full_name ?? raw.fullName ?? raw.name ?? "",
    startDate: raw.start_date ?? raw.startDate ?? "",
  };
};

// Returns every account currently holding this position. Normally 0 or 1 (RoleAssignment is
// meant to enforce one active holder per scope - see backend_changes_requied.md), but the
// endpoint is asked to return a list rather than a single object because that constraint isn't
// guaranteed pre-migration: today, before RoleAssignment exists, nothing stops two accounts from
// both being e.g. role=director for the same school, and the UI needs to surface that rather
// than silently picking one.
export const fetchActiveRoleAssignments = async ({ roleType, scopeId }) => {
  if (!roleType || !scopeId) return [];
  try {
    const result = await api.get("/role-assignments/active", {
      params: { role_type: roleType, scope_id: scopeId },
    });
    const list = Array.isArray(result) ? result : result ? [result] : [];
    return list.map(normalizeAssignment).filter(Boolean);
  } catch {
    return [];
  }
};

export const transferRole = async ({ roleType, scopeId, incomingEmail }) => {
  if (!roleType || !scopeId || !String(incomingEmail || "").trim()) {
    throw new Error("Role, scope, and the incoming person's email are required.");
  }
  const result = await api.post("/role-assignments/transfer", {
    role_type: roleType,
    scope_id: scopeId,
    incoming_email: String(incomingEmail).trim(),
  });
  return normalizeAssignment(result);
};
