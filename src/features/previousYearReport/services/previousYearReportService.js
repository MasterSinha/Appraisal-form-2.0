import { api } from "../../../services/api";
import { getActiveAcademicYear } from "../../../auth/session";

export const getPreviousYearAppraisalReport = ({ academicYear, email } = {}) => {
  const activeAcademicYear = academicYear || getActiveAcademicYear();
  if (!activeAcademicYear) return Promise.resolve(null);
  return api.get("/appraisal/previous-year-report", {
    params: {
      academic_year: activeAcademicYear,
      ...(email ? { email } : {}),
    },
  });
};
