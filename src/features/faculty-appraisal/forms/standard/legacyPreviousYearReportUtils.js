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

const scoreSummaryFor = (source = {}, role = "faculty") =>
  source?.score_summary?.[role] ||
  source?.scoreSummary?.[role] ||
  source?.payload?.score_summary?.[role] ||
  source?.payload?.scoreSummary?.[role] ||
  source?.data?.score_summary?.[role] ||
  source?.data?.scoreSummary?.[role] ||
  source?.data?.payload?.score_summary?.[role] ||
  source?.data?.payload?.scoreSummary?.[role] ||
  null;

const legacyScoreSummary = (sources, role = "faculty") => {
  const summary = sources.map((source) => scoreSummaryFor(source, role)).find(Boolean);
  if (!summary) return null;
  const partA = legacyFirstNumber([summary], ["partA", "part_a"]);
  const partB = legacyFirstNumber([summary], ["partB", "part_b"]);
  const grand = legacyFirstNumber([summary], ["grand", "total", "total_score"]);
  const partAMax = legacyFirstNumber([summary], ["partAMax", "part_a_max"]);
  const partBMax = legacyFirstNumber([summary], ["partBMax", "part_b_max"]);
  const grandMax = legacyFirstNumber([summary], ["grandMax", "grand_max", "max"]);
  return { partA, partB, grand, partAMax, partBMax, grandMax };
};

const legacyReviewerScoreSummary = (sources) =>
  ["hod", "director", "dean", "vc"].reduce((fields, role) => {
    const summary = legacyScoreSummary(sources, role);
    if (!summary) return fields;
    const prefix = role;
    return {
      ...fields,
      [`${prefix}PartA`]: summary.partA ?? fields[`${prefix}PartA`],
      [`${prefix}PartB`]: summary.partB ?? fields[`${prefix}PartB`],
      [`${prefix}Total`]: summary.grand ?? fields[`${prefix}Total`],
      [`${prefix}PartAMax`]: summary.partAMax ?? fields[`${prefix}PartAMax`],
      [`${prefix}PartBMax`]: summary.partBMax ?? fields[`${prefix}PartBMax`],
      [`${prefix}GrandMax`]: summary.grandMax ?? fields[`${prefix}GrandMax`],
    };
  }, {});

export const legacySubmittedTotals = (...sources) => {
  const facultySummary = legacyScoreSummary(sources, "faculty");
  const partA = legacyFirstNumber(sources, ["partATotal", "partA", "part_a_total", "part_a_score", "facultyPartA", "faculty_part_a", "selfPartA", "self_part_a"]);
  const partB = legacyFirstNumber(sources, ["partBTotal", "partB", "part_b_total", "part_b_score", "facultyPartB", "faculty_part_b", "selfPartB", "self_part_b"]);
  const grand = legacyFirstNumber(sources, ["grandTotal", "grand_total", "totalScore", "total_score", "total", "facultyTotal", "faculty_total", "selfTotal", "self_total"]);
  if (!facultySummary && partA === null && partB === null && grand === null) return null;
  // Also carry forward each reviewing authority's own stored totals (hodPartA/hodTotal,
  // directorPartA/directorTotal, deanPartA/deanTotal, vcPartA/vcTotal, ...) so the report's
  // "Total score given by each authority" reflects what that authority actually recorded,
  // instead of the previous-year normalizer silently falling back to re-summing row data.
  return {
    partA: facultySummary?.partA ?? partA,
    partB: facultySummary?.partB ?? partB,
    grand: facultySummary?.grand ?? grand,
    partAMax: facultySummary?.partAMax ?? null,
    partBMax: facultySummary?.partBMax ?? null,
    grandMax: facultySummary?.grandMax ?? null,
    ...standardReviewSummary(...sources),
    ...legacyReviewerScoreSummary(sources),
  };
};
