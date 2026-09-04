export const NON_TEACHING_ROLES = [
  "non_teaching_staff",
  "reporting_officer",
  "registrar",
];

export const NON_TEACHING_ROLE_LABELS = {
  non_teaching_staff: "Non-Teaching Staff",
  reporting_officer: "Reporting Officer",
  registrar: "Registrar",
};

export const NON_TEACHING_ROLE_ALIASES = {
  staff: "non_teaching_staff",
  "non teaching staff": "non_teaching_staff",
  "non-teaching staff": "non_teaching_staff",
  non_teaching_staff: "non_teaching_staff",
  "non teaching": "non_teaching_staff",
  "reporting officer": "reporting_officer",
  "reporting-officer": "reporting_officer",
  reporting_officer: "reporting_officer",
  "reporting head": "reporting_officer",
  registrar: "registrar",
};

const normalizeText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

export const normalizeNonTeachingRole = (role, fallback = "") => {
  const normalized = normalizeText(role);
  return NON_TEACHING_ROLE_ALIASES[normalized] || fallback;
};

export const isNonTeachingRole = (role) =>
  NON_TEACHING_ROLES.includes(normalizeNonTeachingRole(role, role));

// The `reports_to_registrar` flag (set by an admin on the user record) can arrive at the
// frontend nested in a few shapes depending on whether we hold a bare profile, a review-queue
// item, or a saved form payload. Look in every place it might be before giving up.
const reportsToRegistrarCandidates = (source = {}) => [
  source.reports_to_registrar,
  source.reportsToRegistrar,
  source.direct_to_registrar,
  source.directToRegistrar,
  source.profile?.reports_to_registrar,
  source.profile?.reportsToRegistrar,
  source.form?.reports_to_registrar,
  source.form?.reportsToRegistrar,
  source.form?.info?.reports_to_registrar,
  source.form?.info?.reportsToRegistrar,
  source.payload?.reports_to_registrar,
  source.payload?.reportsToRegistrar,
  source.payload?.info?.reports_to_registrar,
  source.payload?.info?.reportsToRegistrar,
  source.info?.reports_to_registrar,
  source.info?.reportsToRegistrar,
];

// Resolve the flag to an explicit boolean, or `undefined` when it was never provided.
// A computed/defaulted `false` from an older code path is indistinguishable from an
// admin-set `false` once written to a plain field, so callers that need the "unknown"
// distinction must pass the raw source (profile / raw API row), not a normalized item.
export const readReportsToRegistrarFlag = (source = {}) => {
  for (const value of reportsToRegistrarCandidates(source)) {
    if (value === undefined || value === null || value === "") continue;
    if (value === true || value === 1) return true;
    if (value === false || value === 0) return false;
    const normalized = String(value).trim().toLowerCase();
    if (["true", "1", "yes", "y"].includes(normalized)) return true;
    if (["false", "0", "no", "n"].includes(normalized)) return false;
  }
  return undefined;
};

// Does a Reporting Officer's OWN appraisal route through the Registrar before the VC?
//   true  (or missing/unknown) => RO(self) -> Registrar -> VC   (legacy default)
//   false                       => RO(self) -> VC directly
// Mirrors how `non_teaching_staff` already honours the same flag, but the RO default is the
// opposite (unknown => keep the Registrar step) so existing ROs are never silently re-routed.
export const roReportsToRegistrar = (source = {}) => {
  const flag = readReportsToRegistrarFlag(source);
  return flag === undefined ? true : flag;
};

