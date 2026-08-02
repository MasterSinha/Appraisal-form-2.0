const numberValue = (value) => parseFloat(value) || 0;

export const isLegacyTwoPartAcademicYear = (academicYear = "") =>
  String(academicYear).replace(/\s+/g, "") === "2025-2026" ||
  String(academicYear).replace(/\s+/g, "") === "2025-26";

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
  return { partA, partB, grand };
};
