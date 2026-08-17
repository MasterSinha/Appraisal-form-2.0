import { api } from "./api";

// Director-only: list every Faculty account for a school, so they can be individually assigned
// to an HOD from Manage Programs' "Assign Faculty" step. New endpoint - needs backend support
// (GET /schools/{school_code}/faculty -> [{email, full_name, department}]); falls back to an
// empty list if it 404s, same graceful-degradation pattern as fetchSchoolHods.
const normalizeFaculty = (raw) => ({
  email: raw?.email ?? raw?.user_email ?? raw?.userEmail ?? "",
  fullName: raw?.full_name ?? raw?.fullName ?? raw?.name ?? "",
  department: raw?.department ?? "",
});

export const fetchSchoolFaculty = async (schoolCode) => {
  if (!schoolCode) return [];
  try {
    const result = await api.get(`/schools/${encodeURIComponent(schoolCode)}/faculty`);
    return (Array.isArray(result) ? result : []).map(normalizeFaculty).filter((f) => f.email);
  } catch {
    return [];
  }
};

// Director-only: directly set which program (and therefore which HOD) a faculty member
// belongs to. New endpoint - needs backend support
// (POST /schools/{school_code}/faculty/{email}/assign, body {department}). Unlike the list
// fetch above, a failed assignment must surface to the Director rather than silently no-op, so
// this does not catch/swallow errors.
export const assignFacultyToProgram = async ({ schoolCode, facultyEmail, departmentName }) => {
  if (!schoolCode || !facultyEmail || !departmentName) {
    throw new Error("School, faculty, and program are required.");
  }
  return await api.post(
    `/schools/${encodeURIComponent(schoolCode)}/faculty/${encodeURIComponent(facultyEmail)}/assign`,
    { department: departmentName }
  );
};
