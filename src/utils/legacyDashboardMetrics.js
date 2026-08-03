const n = (value) => parseFloat(value) || 0;

export const isLegacyDashboardAcademicYear = (academicYear = "") => {
  const normalized = String(academicYear).replace(/\s+/g, "");
  return normalized === "2025-2026" || normalized === "2025-26" || normalized === "25-26";
};

export const legacyDashboardMetrics = ({
  academicYear,
  labelPrefix = "",
  partA,
  partB,
  total,
  colors = {},
}) => {
  if (!isLegacyDashboardAcademicYear(academicYear)) return null;
  const prefix = String(labelPrefix || "").trim();
  const label = (part) => (prefix ? `${prefix} ${part}` : part);
  const partATotal = n(partA);
  const partBTotal = n(partB);
  return [
    { label: label("Part A"), val: partATotal, max: 200, color: colors.partA || "#6366f1" },
    { label: label("Part B"), val: partBTotal, max: 375, color: colors.partB || "#0ea5e9" },
    { label: label("Total"), val: total !== undefined && total !== null && String(total).trim() !== "" ? n(total) : partATotal + partBTotal, max: 575, color: colors.total || "#4338ca" },
  ];
};
