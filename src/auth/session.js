import {
  DEAN_TRACKS,
  canonicalDepartmentValue,
  canonicalSchoolValue,
  isCisrSchool,
  isSoemrSchool,
  normalizeHierarchyText,
} from "../constants/universityHierarchy";
import { NON_TEACHING_ROLES, isNonTeachingRole } from "../constants/nonTeachingHierarchy";
import { APP_INFO } from "../constants/formConfig";
import { departmentHasHod, getDeanTrack } from "../utils/hierarchy";

export const VALID_ROLES = ["faculty", "hod", "center_head", "director", "dean", "vc", "admin", "super_admin", ...NON_TEACHING_ROLES];

export const AUTH_SESSION_KEYS = [
  "accessToken",
  "token",
  "role",
  "username",
  "email",
  "userEmail",
  "name",
  "department",
  "school",
  "employeeId",
  "designation",
  "qualification",
  "experience",
  "phone",
  "profilePictureUrl",
  "profile_picture_url",
  "avatarUrl",
  "reports_to_registrar",
  "reportsToRegistrar",
  "hasHod",
  "hasHOD",
];

const ROLE_ALIASES = {
  faculty: "faculty",
  hod: "hod",
  "head of department": "hod",
  center_head: "center_head",
  "center head": "center_head",
  "centre head": "center_head",
  "cisr center head": "center_head",
  "cisr centre head": "center_head",
  director: "director",
  dean: "dean",
  vc: "vc",
  "vice chancellor": "vc",
  "vice-chancellor": "vc",
  "vice_chancellor": "vc",
  "vice chancelor": "vc",
  "vice-chancelor": "vc",
  "vice_chancelor": "vc",
  staff: "non_teaching_staff",
  "non teaching staff": "non_teaching_staff",
  "non-teaching staff": "non_teaching_staff",
  non_teaching_staff: "non_teaching_staff",
  "reporting officer": "reporting_officer",
  "reporting-officer": "reporting_officer",
  reporting_officer: "reporting_officer",
  "reporting head": "reporting_officer",
  registrar: "registrar",
  admin: "admin",
  super_admin: "super_admin",
  "super admin": "super_admin",
};

export const normalizeRole = (role, fallback = "faculty") => {
  const key = String(role || "").trim().toLowerCase();
  if (!key) return fallback;
  return ROLE_ALIASES[key] || fallback;
};

export const hasValidRole = (role) => VALID_ROLES.includes(normalizeRole(role, ""));

export const normalizeAcademicYearLabel = (value) => {
  const label = String(value || "").trim();
  const shortMatch = label.match(/^(\d{2})-(\d{2})$/);
  if (shortMatch) return `20${shortMatch[1]}-20${shortMatch[2]}`;
  return label;
};

export const getActiveAcademicYear = (fallback = APP_INFO.DEFAULT_AY) => {
  if (typeof window === "undefined") return normalizeAcademicYearLabel(fallback || APP_INFO.DEFAULT_AY);
  return normalizeAcademicYearLabel(
    sessionStorage.getItem("academicYear") ||
    localStorage.getItem("academicYear") ||
    fallback ||
    APP_INFO.DEFAULT_AY,
  );
};

export const setActiveAcademicYear = (academicYear) => {
  const normalized = normalizeAcademicYearLabel(academicYear);
  if (!normalized || typeof window === "undefined") return normalized;
  sessionStorage.setItem("academicYear", normalized);
  localStorage.setItem("academicYear", normalized);
  return normalized;
};

export const schoolHasHod = (school) => {
  if (!school) return false;
  return isSoemrSchool(school);
};

const firstValue = (...values) =>
  values.find((value) => String(value ?? "").trim() !== "") || "";

const boolFlag = (...values) => {
  const value = firstValue(...values);
  if (value === true || value === 1) return true;
  return ["true", "1", "yes", "y"].includes(String(value || "").trim().toLowerCase());
};

const profilePictureValue = (profile = {}) =>
  firstValue(
    profile.profile_picture_url,
    profile.profilePictureUrl,
    profile.avatar_url,
    profile.avatarUrl,
    profile.photo_url,
    profile.photoUrl,
    profile.picture_url,
    profile.pictureUrl,
  );

const deanDivisionValue = (value) => {
  const normalized = normalizeHierarchyText(value);
  if (normalized === "engineering") return DEAN_TRACKS.ENGINEERING;
  if (normalized === "non engineering" || normalized === "nonengineering") return DEAN_TRACKS.NON_ENGINEERING;
  return "";
};

const profileSchoolValue = (role, rawSchool, profile = {}) => {
  if (isNonTeachingRole(role)) return "";
  const division = deanDivisionValue(rawSchool);
  if (role === "dean" && division) return division;
  const canonical = canonicalSchoolValue(rawSchool);
  if (role === "dean" && canonical) return getDeanTrack({ ...profile, school: canonical });
  return canonical;
};

export const buildProfilePayload = (formData, academicYear = "2026-2027") => {
  const role = normalizeRole(formData.role);
  const nonTeachingRole = isNonTeachingRole(role);
  const school = profileSchoolValue(role, formData.school, formData);
  // Every teaching school can have Director-managed departments/programs now, not just SoEMR.
  // This used to gate on isSoemrSchool and silently force department to "" for every other
  // school - even when the caller (Signup/EditProfile) had already correctly resolved one from
  // its own department dropdown, that value never actually reached the saved profile.
  const department = nonTeachingRole
    ? String(formData.department || "").trim()
    : canonicalDepartmentValue(formData.department);
  // HOD can be assigned multiple departments/programs at once (see New_backend.md). Faculty and
  // every other teaching role still use the single `department` value above.
  const departments = role === "hod" && Array.isArray(formData.departments)
    ? formData.departments.map((value) => canonicalDepartmentValue(value)).filter(Boolean)
    : undefined;

  return {
    email: String(formData.email || "").trim().toLowerCase(),
    employee_id: String(formData.employeeId || "").trim() || null,
    full_name: String(formData.name || "").trim(),
    qualification: String(formData.qualification || "").trim() || null,
    designation: String(formData.designation || "").trim() || null,
    department: department || null,
    ...(departments ? { departments } : {}),
    school: school || null,
    teaching_experience: String(formData.experience || "").trim() || null,
    phone: String(formData.phone || "").trim() || null,
    profile_picture_url: String(formData.profilePictureUrl || formData.profile_picture_url || "").trim() || null,
    academic_year: academicYear,
    appraisal_role: role,
    reports_to_registrar: nonTeachingRole && boolFlag(formData.reports_to_registrar, formData.reportsToRegistrar),
  };
};

export const storeUserSession = ({ token, profile = {}, fallbackEmail = "" }) => {
  const safeProfile = profile || {};
  const email = firstValue(safeProfile.email, fallbackEmail).toLowerCase();
  const name = firstValue(safeProfile.full_name, email);
  const role = normalizeRole(firstValue(safeProfile.appraisal_role, safeProfile.role));
  const nonTeachingRole = isNonTeachingRole(role);
  const school = profileSchoolValue(role, firstValue(safeProfile.school), safeProfile);
  const department = nonTeachingRole
    ? firstValue(safeProfile.department)
    : isSoemrSchool(school)
      ? canonicalDepartmentValue(firstValue(safeProfile.department))
      : firstValue(safeProfile.department);
  const normalizedDepartment = nonTeachingRole || !isCisrSchool(school) ? department : "";
  const reportsToRegistrar = role === "non_teaching_staff" && boolFlag(
    safeProfile.reports_to_registrar,
    safeProfile.reportsToRegistrar,
    safeProfile.direct_to_registrar,
    safeProfile.directToRegistrar,
  );
  const profilePictureUrl = profilePictureValue(safeProfile);
  const academicYear = getActiveAcademicYear(firstValue(safeProfile.academic_year, safeProfile.academicYear, safeProfile.ay, APP_INFO.DEFAULT_AY));

  if (token) {
    sessionStorage.setItem("accessToken", token);
  }

  const items = {
    role,
    username: email,
    email,
    name,
    department: normalizedDepartment,
    school,
    employeeId: firstValue(safeProfile.employee_id),
    designation: firstValue(safeProfile.designation),
    qualification: firstValue(safeProfile.qualification),
    experience: firstValue(safeProfile.teaching_experience),
    phone: firstValue(safeProfile.phone),
    profilePictureUrl,
    profile_picture_url: profilePictureUrl,
    avatarUrl: profilePictureUrl,
    reports_to_registrar: reportsToRegistrar ? "true" : "false",
    reportsToRegistrar: reportsToRegistrar ? "true" : "false",
    academicYear,
  };

  Object.entries(items).forEach(([k, v]) => {
    sessionStorage.setItem(k, v);
  });

  // HOD's list of assigned departments/programs (see New_backend.md) - stored as JSON since
  // sessionStorage only holds strings. Falls back to the single `department` value so an HOD
  // who's only ever had one assignment still resolves correctly before this array is populated.
  const departmentsList = role === "hod"
    ? (Array.isArray(safeProfile.departments) && safeProfile.departments.length
        ? safeProfile.departments
        : (normalizedDepartment ? [normalizedDepartment] : []))
    : [];
  sessionStorage.setItem("departments", JSON.stringify(departmentsList));

  const hasHod = departmentHasHod(school, normalizedDepartment);
  sessionStorage.setItem("hasHod", hasHod ? "true" : "false");
  sessionStorage.setItem("hasHOD", hasHod ? "true" : "false");

  return { email, role, school, department: normalizedDepartment, departments: departmentsList, reports_to_registrar: reportsToRegistrar };
};

export const getSessionItem = (key) => {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(key);
};

export const getUserEmail = () => {
  return getSessionItem("username") || getSessionItem("email") || getSessionItem("userEmail") || "";
};

export const clearUserSession = () => {
  if (typeof window === "undefined") return;
  sessionStorage.clear();
  AUTH_SESSION_KEYS.forEach((key) => localStorage.removeItem(key));
};


