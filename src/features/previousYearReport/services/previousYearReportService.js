import { api } from "../../../services/api";

export const getPreviousYearAppraisalReport = ({ academicYear, email } = {}) => {
  if (!academicYear) return Promise.resolve(null);
  return api.get("/appraisal/previous-year-report", {
    params: {
      academic_year: academicYear,
      ...(email ? { email } : {}),
    },
  });
};
