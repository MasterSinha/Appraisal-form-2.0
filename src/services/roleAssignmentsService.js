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

// Vacates the active assignment for this scope without appointing a replacement - e.g. a
// Director removing an HOD from a program with no immediate successor. See New_backend.md
// ("Remove HOD from a program") - this endpoint does not exist server-side yet.
export const removeRoleAssignment = async ({ roleType, scopeId }) => {
  if (!roleType || !scopeId) {
    throw new Error("Role and scope are required.");
  }
  return await api.post("/role-assignments/remove", {
    role_type: roleType,
    scope_id: scopeId,
  });
};

const normalizeHodOption = (raw) => ({
  email: raw?.email ?? raw?.user_email ?? raw?.userEmail ?? "",
  fullName: raw?.full_name ?? raw?.fullName ?? raw?.name ?? "",
  departments: Array.isArray(raw?.departments) ? raw.departments : (raw?.department ? [raw.department] : []),
});

// Lists existing HOD accounts already registered for this school, so a Director can add another
// program to someone who's already an HOD there instead of typing their email blind. See
// New_backend.md ("List HODs for a school") - this endpoint does not exist server-side yet; the
// UI falls back to manual email entry when it 404s.
export const fetchSchoolHods = async (schoolCode) => {
  if (!schoolCode) return [];
  try {
    const result = await api.get(`/schools/${encodeURIComponent(schoolCode)}/hods`);
    return (Array.isArray(result) ? result : []).map(normalizeHodOption).filter((hod) => hod.email);
  } catch {
    return [];
  }
};

// Deactivates an HOD account entirely (not just one program assignment) - e.g. a test/mistaken
// account, or someone who's left the role and isn't being replaced. Callers should clear the
// person's program assignments (removeRoleAssignment, one call per program) before calling this,
// so nothing is left pointing at a deactivated account. New endpoint - needs backend support
// (DELETE /schools/{school_code}/hods/{email}, soft-delete via is_active=false, Director-of-that-
// school-or-Admin auth, same pattern as the department/HOD endpoints in New_backend.md).
export const deactivateHodAccount = async ({ schoolCode, email }) => {
  if (!schoolCode || !email) {
    throw new Error("School and email are required.");
  }
  return await api.delete(`/schools/${encodeURIComponent(schoolCode)}/hods/${encodeURIComponent(email)}`);
};
