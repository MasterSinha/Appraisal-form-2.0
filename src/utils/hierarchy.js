import {
  DEAN_TRACKS,
  UNIVERSITY_SCHOOLS,
  canonicalDepartmentValue,
  getSchoolKey as getConfiguredSchoolKey,
  normalizeHierarchyText,
} from "../constants/universityHierarchy.js";
import { isNonTeachingRole, normalizeNonTeachingRole } from "../constants/nonTeachingHierarchy.js";

const ENGINEERING = DEAN_TRACKS.ENGINEERING;
const NON_ENGINEERING = DEAN_TRACKS.NON_ENGINEERING;
const DIRECT_VC = DEAN_TRACKS.DIRECT_VC;

export const SCHOOL_HIERARCHY = Object.fromEntries(
  UNIVERSITY_SCHOOLS.map((school) => [
    school.code,
    {
      name: school.name,
      label: school.label,
      deanTrack: school.deanTrack,
      directorLayer: true,
      hodDepartments: school.hodDepartments,
      aliases: school.aliases,
    },
  ])
);

const normalizeText = normalizeHierarchyText;

export const normalizeRoleForWorkflow = (role) => {
  const value = normalizeText(role);
  if (value === "admin" || value === "administrator") return "admin";
  if (value === "vice chancellor" || value === "vice chancelor" || value === "vc") return "vc";
  const nonTeachingRole = normalizeNonTeachingRole(value, "");
  if (nonTeachingRole) return nonTeachingRole;
  if (value === "center head" || value === "centre head" || value === "center_head" || value === "centre_head" || value === "centerhead" || value === "centrehead" || value.includes("cisr center head") || value.includes("cisr centre head") || value.includes("cisr_center_head") || value.includes("cisrcenterhead") || value.includes("cisrcentrehead")) return "center_head";
  if (value.includes("dean")) return "dean";
  if (value.includes("director")) return "director";
  if (value === "hod" || value.includes("head of department")) return "hod";
  return "faculty";
};

export const getSchoolKey = getConfiguredSchoolKey;

export const getSchoolHierarchy = (school) => SCHOOL_HIERARCHY[getSchoolKey(school)] || null;

export const getDeanTrack = (profile = {}) => {
  const rawSchool = normalizeText(profile.school);
  if (rawSchool === "non engineering" || rawSchool === "nonengineering" || rawSchool === "non_engineering") {
    return NON_ENGINEERING;
  }
  if (rawSchool === "engineering") {
    return ENGINEERING;
  }

  const combined = normalizeText(`${profile.school || ""} ${profile.department || ""} ${profile.designation || ""} ${profile.email || ""}`);

  if (combined.includes("non engineering") || combined.includes("nonengineering") || combined.includes("commerce") || combined.includes("media") || combined.includes("humanities") || combined.includes("social sciences") || combined.includes("design") || combined.includes("applied arts") || combined.includes("socm") || combined.includes("somcs") || combined.includes("sohss") || combined.includes("sod") || combined.includes("soaa") || combined.includes("soa")) {
    return NON_ENGINEERING;
  }

  const schoolConfig = getSchoolHierarchy(profile.school);
  if (schoolConfig?.deanTrack) return schoolConfig.deanTrack;

  if (combined.includes("cisr") || combined.includes("interdisciplinary studies and research") || combined.includes("center head") || combined.includes("centre head")) {
    return DIRECT_VC;
  }

  return ENGINEERING;
};

export const departmentHasHod = (school, department) => {
  const config = getSchoolHierarchy(school);
  if (!config?.hodDepartments?.length) return false;

  return Boolean(canonicalDepartmentValue(department));
};

export const getReviewChain = (profile = {}) => {
  const role = normalizeRoleForWorkflow(profile.appraisal_role || profile.appraisalRole || profile.role);
  const reportsToRegistrar = profile.reports_to_registrar === true ||
    profile.reportsToRegistrar === true ||
    String(profile.reports_to_registrar || profile.reportsToRegistrar || "").trim().toLowerCase() === "true";

  if (role === "vc") return [];
  if (role === "registrar") return ["vc"];
  if (role === "reporting_officer") return ["registrar", "vc"];
  if (role === "non_teaching_staff")
    return reportsToRegistrar ? ["registrar", "vc"] : ["reporting_officer", "registrar", "vc"];
  if (role === "center_head") return ["vc"];
  if (role === "dean") return ["vc"];
  if (role === "director") return ["dean", "vc"];
  if (role === "hod") return ["director", "dean", "vc"];

  if (getSchoolKey(profile.school) === "CISR") {
    return ["center_head", "vc"];
  }

  if (getSchoolKey(profile.school) === "SoEMR") {
    return ["hod", "director", "dean", "vc"];
  }

  return departmentHasHod(profile.school, profile.department)
    ? ["hod", "director", "dean", "vc"]
    : ["director", "dean", "vc"];
};

export const visiblePreviousReviewRoles = (reviewerRole, subjectProfile = {}) => {
  const role = normalizeRoleForWorkflow(reviewerRole);
  if (role === "admin") {
    return getSchoolKey(subjectProfile.school) === "CISR"
      ? ["center_head"]
      : ["hod", "director", "dean"];
  }
  if (role !== "vc") return [];

  const chain = getReviewChain(subjectProfile);
  const reviewerIndex = chain.indexOf(role);
  if (reviewerIndex < 0) return [];

  return chain.slice(0, reviewerIndex);
};

export const roleLabel = (role) => ({
  hod: "HOD",
  director: "Director",
  center_head: "Center Head",
  reporting_officer: "Reporting Officer",
  registrar: "Registrar",
  dean: "Dean",
  vc: "VC",
  non_teaching_staff: "Non-Teaching Staff",
  faculty: "Faculty",
}[role] || role);

export const pendingStatusFor = (role) => `Pending ${roleLabel(role)} Review`;
export const reviewedStatusFor = (role) => `${roleLabel(role)} Reviewed`;
export const rejectedStatusFor = (role) => `${roleLabel(role)} Rejected`;
export const isPendingReviewStatusFor = (status, role) => {
  const reviewerRole = normalizeRoleForWorkflow(role);
  const reviewerLabel = normalizeText(roleLabel(reviewerRole));
  const reviewerKey = normalizeText(reviewerRole);

  if (!reviewerRole) return false;
  const values = (Array.isArray(status) ? status : [status]).map(normalizeText).filter(Boolean);
  const pendingValues = [
    normalizeText(pendingStatusFor(reviewerRole)),
    `pending ${reviewerLabel}`,
    `pending ${reviewerKey}`,
    reviewerRole === "reporting_officer" ? "pending ro" : "",
    reviewerRole === "vc" ? "pending vice chancellor" : "",
    "pending review",
  ].filter(Boolean);
  return values.some((value) => pendingValues.includes(value));
};
export const isRejectedStatus = (status) => normalizeText(status).includes("rejected");
const timestampMs = (value) => {
  const time = value ? new Date(value).getTime() : NaN;
  return Number.isFinite(time) ? time : null;
};
export const reviewListFrom = (reviews = []) => {
  if (Array.isArray(reviews)) return reviews;
  if (!reviews || typeof reviews !== "object") return [];
  return Object.values(reviews).filter((review) => review && typeof review === "object");
};
const reviewTimestampMs = (review = {}) =>
  timestampMs(review?.reviewed_at || review?.reviewedAt || review?.updated_at || review?.updatedAt || review?.created_at || review?.createdAt);
const declarationTimestampMs = (declaration = {}) =>
  timestampMs(declaration?.submitted_at || declaration?.submittedAt || declaration?.updated_at || declaration?.updatedAt || declaration?.created_at || declaration?.createdAt);
export const hasRejectedReview = (reviews = [], { since } = {}) => {
  const sinceMs = timestampMs(since);
  return reviewListFrom(reviews).some((review) => [
    review?.status,
    review?.review_status,
    review?.reviewStatus,
    review?.workflow_status,
    review?.workflowStatus,
    review?.decision,
  ].some(isRejectedStatus) && (!sinceMs || !reviewTimestampMs(review) || reviewTimestampMs(review) >= sinceMs));
};
export const hasActiveRejection = (declaration, reviews = []) =>
  isRejectedStatus(declaration?.status || declaration?.workflow_status || declaration?.workflowStatus) ||
  hasRejectedReview(reviews, { since: declarationTimestampMs(declaration) });
export const isAppraisalFinalisedByVc = (item = {}) => {
  const statuses = [
    item?.declaration?.status,
    item?.declarationStatus,
    item?.declaration_status,
    item?.workflowStatus,
    item?.workflow_status,
    item?.status,
  ].map(normalizeText);
  return statuses.some((status) => status === "reviewed" || status === "vc reviewed");
};
export const reviewStatusForDecision = (role, decision = "approved") =>
  decision === "rejected" ? rejectedStatusFor(role) : reviewedStatusFor(role);

export const canReviewerRejectProfile = (reviewerRole, subjectProfile = {}) => {
  const role = normalizeRoleForWorkflow(reviewerRole);
  if (!role || role === "faculty") return false;

  const chain = getReviewChain(subjectProfile);
  if (chain.length > 0) {
    return role === chain[0];
  }
  return false;
};

export const workflowValidationError = (profile = {}) => {
  const role = normalizeRoleForWorkflow(profile.appraisal_role || profile.appraisalRole || profile.role);
  const schoolKey = getSchoolKey(profile.school);

  if (isNonTeachingRole(role)) {
    return "";
  }

  if (role !== "vc" && role !== "dean" && !schoolKey) {
    return "Please select one of the approved schools or centers before submitting.";
  }

  if (role === "hod" && schoolKey !== "SoEMR") {
    return "HOD submissions are allowed only for SoEMR departments.";
  }

  if (role === "center_head" && schoolKey !== "CISR") {
    return "Center Head submissions are allowed only for CISR.";
  }

  if (schoolKey === "SoEMR" && (role === "faculty" || role === "hod") && !canonicalDepartmentValue(profile.department)) {
    return "Please select a valid SoEMR department before submitting.";
  }

  return "";
};

export const canAuthorityReviewProfile = (reviewerProfile = {}, subjectProfile = {}) => {
  const reviewerRole = normalizeRoleForWorkflow(reviewerProfile.appraisal_role || reviewerProfile.role);
  const subjectRole = normalizeRoleForWorkflow(subjectProfile.appraisal_role || subjectProfile.role);

  if (reviewerRole === "vc") return subjectRole !== "vc";

  if (reviewerRole === "registrar") {
    return subjectRole === "non_teaching_staff" || subjectRole === "reporting_officer";
  }

  if (reviewerRole === "reporting_officer") {
    const reportsToRegistrar = subjectProfile.reports_to_registrar === true ||
      subjectProfile.reportsToRegistrar === true ||
      String(subjectProfile.reports_to_registrar || subjectProfile.reportsToRegistrar || "").trim().toLowerCase() === "true";
    return subjectRole === "non_teaching_staff" && !reportsToRegistrar;
  }

  if (isNonTeachingRole(reviewerRole) || isNonTeachingRole(subjectRole)) {
    return false;
  }

  if (reviewerRole === "dean") {
    const track = getDeanTrack(subjectProfile);
    return subjectRole !== "dean" &&
      track !== DIRECT_VC &&
      getDeanTrack(reviewerProfile) === track;
  }

  if (reviewerRole === "director") {
    return getSchoolKey(reviewerProfile.school) === getSchoolKey(subjectProfile.school) &&
      (subjectRole === "faculty" || subjectRole === "hod");
  }

  if (reviewerRole === "hod") {
    return subjectRole === "faculty" &&
      departmentHasHod(subjectProfile.school, subjectProfile.department) &&
      getSchoolKey(reviewerProfile.school) === getSchoolKey(subjectProfile.school) &&
      canonicalDepartmentValue(reviewerProfile.department) === canonicalDepartmentValue(subjectProfile.department);
  }

  if (reviewerRole === "center_head") {
    return subjectRole === "faculty" &&
      getSchoolKey(reviewerProfile.school) === "CISR" &&
      getSchoolKey(subjectProfile.school) === "CISR";
  }

  return false;
};

const getItem = (k) => (typeof window !== "undefined" ? sessionStorage.getItem(k) || localStorage.getItem(k) || "" : "");

export const profileFromsessionStorage = () => ({
  email: getItem("username") || getItem("email") || getItem("userEmail") || "",
  full_name: getItem("name") || "",
  appraisal_role: getItem("role") || "",
  school: getItem("school") || "",
  department: getItem("department") || "",
  designation: getItem("designation") || "",
  qualification: getItem("qualification") || "",
  teaching_experience: getItem("experience") || "",
  experience: getItem("experience") || "",
  employee_id: getItem("employeeId") || "",
  profile_picture_url: getItem("profilePictureUrl") || getItem("profile_picture_url") || getItem("avatarUrl") || "",
  profilePictureUrl: getItem("profilePictureUrl") || getItem("profile_picture_url") || getItem("avatarUrl") || "",
  avatar_url: getItem("profilePictureUrl") || getItem("profile_picture_url") || getItem("avatarUrl") || "",
  avatarUrl: getItem("profilePictureUrl") || getItem("profile_picture_url") || getItem("avatarUrl") || "",
  reports_to_registrar: getItem("reports_to_registrar") === "true" || getItem("reportsToRegistrar") === "true",
  reportsToRegistrar: getItem("reports_to_registrar") === "true" || getItem("reportsToRegistrar") === "true",
});
