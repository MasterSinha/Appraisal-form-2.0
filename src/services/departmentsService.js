import { api } from "./api";

// School-scoped department list, managed by the Director of that school.
// Backend contract documented in backend_changes_requied.md.
const normalizeDepartment = (raw = {}) => ({
  id: raw.id ?? raw.department_id ?? raw.departmentId ?? "",
  name: raw.name ?? raw.department_name ?? raw.departmentName ?? "",
  schoolCode: raw.school_code ?? raw.schoolCode ?? raw.school ?? "",
});

export const listSchoolDepartments = async (schoolCode) => {
  if (!schoolCode) return [];
  const items = await api.get(`/schools/${encodeURIComponent(schoolCode)}/departments`);
  return (Array.isArray(items) ? items : []).map(normalizeDepartment).filter((dept) => dept.name);
};

export const addSchoolDepartment = async (schoolCode, name) => {
  if (!schoolCode || !String(name || "").trim()) {
    throw new Error("School and department name are required.");
  }
  const created = await api.post(`/schools/${encodeURIComponent(schoolCode)}/departments`, {
    name: String(name).trim(),
  });
  return normalizeDepartment(created || {});
};

export const removeSchoolDepartment = async (schoolCode, departmentId) => {
  if (!schoolCode || !departmentId) {
    throw new Error("School and department are required.");
  }
  return await api.delete(`/schools/${encodeURIComponent(schoolCode)}/departments/${encodeURIComponent(departmentId)}`);
};
