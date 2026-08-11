import { standardReviewSummary } from "../../../../utils/reviewSummaryTotals";

const numberValue = (value) => parseFloat(value) || 0;

export const isLegacyTwoPartAcademicYear = (academicYear = "") =>
  String(academicYear).replace(/\s+/g, "") === "2025-2026" ||
  String(academicYear).replace(/\s+/g, "") === "2025-26" ||
  String(academicYear).replace(/\s+/g, "") === "25-26";

const legacyFirstNumber = (sources, keys) => {
  for (const source of sources) {
    if (!source || typeof source !== "object") continue;
    for (const key of keys) {
      const value = source[key];
      if (value !== undefined && value !== null && String(value).trim() !== "") return numberValue(value);
    }
  }
  return null;
};

export const legacySubmittedTotals = (...sources) => {
  const partA = legacyFirstNumber(sources, ["partATotal", "partA", "part_a_total", "part_a_score", "facultyPartA", "faculty_part_a", "selfPartA", "self_part_a"]);
  const partB = legacyFirstNumber(sources, ["partBTotal", "partB", "part_b_total", "part_b_score", "facultyPartB", "faculty_part_b", "selfPartB", "self_part_b"]);
  const grand = legacyFirstNumber(sources, ["grandTotal", "grand_total", "totalScore", "total_score", "total", "facultyTotal", "faculty_total", "selfTotal", "self_total"]);
  if (partA === null && partB === null && grand === null) return null;
  // Also carry forward each reviewing authority's own stored totals (hodPartA/hodTotal,
  // directorPartA/directorTotal, deanPartA/deanTotal, vcPartA/vcTotal, ...) so the report's
  // "Total score given by each authority" reflects what that authority actually recorded,
  // instead of the previous-year normalizer silently falling back to re-summing row data.
  return { partA, partB, grand, ...standardReviewSummary(...sources) };
};
