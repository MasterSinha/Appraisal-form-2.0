import { getFileUrl } from "../../../services/api";
import { clampScore, filesForDocValue } from "../../../utils/appraisalFormUtils";

const FACULTY_SCORE_KEYS = ["score", "self_score", "faculty_score", "selfScore", "facultyScore"];
const HOD_SCORE_KEYS = ["hod", "hod_score", "hodScore", "center_head", "center_head_score", "centerHeadScore"];
const DIRECTOR_SCORE_KEYS = ["director", "director_score", "directorScore"];
const DEAN_SCORE_KEYS = ["dean", "dean_score", "deanScore"];
const VC_SCORE_KEYS = ["vc", "vc_score", "vcScore"];
const REMARK_KEYS = ["remarks", "remark", "reviewer_remarks", "reviewerRemarks"];

export const previousYearNumber = (value) => {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const firstPresent = (...values) =>
  values.find((value) => value !== undefined && value !== null && String(value).trim() !== "");

const parseMaybeJson = (value) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed || !["{", "["].includes(trimmed[0])) return value;
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
};

const readFromAliases = (source = {}, aliases = []) => {
  for (const alias of aliases) {
    const value = source?.[alias];
    if (value !== undefined && value !== null && String(value).trim() !== "") return value;
  }
  return "";
};

export const previousYearScore = (row = {}, role = "faculty") => {
  const aliases = {
    faculty: FACULTY_SCORE_KEYS,
    hod: HOD_SCORE_KEYS,
    director: DIRECTOR_SCORE_KEYS,
    dean: DEAN_SCORE_KEYS,
    vc: VC_SCORE_KEYS,
  }[role] || FACULTY_SCORE_KEYS;
  return readFromAliases(row, aliases);
};

const unwrapResponse = (response = {}) => parseMaybeJson(response?.data || response || {});

const responseForm = (response = {}) => {
  const data = unwrapResponse(response);
  return parseMaybeJson(data?.payload?.form || data?.form || data?.payload?.data || data?.data?.payload?.form || data?.data?.form || {});
};

const responseTotals = (response = {}) => {
  const data = unwrapResponse(response);
  return parseMaybeJson(data?.payload?.totals || data?.totals || data?.data?.payload?.totals || data?.data?.totals || {});
};

const responseProfile = (response = {}, form = {}) => {
  const data = unwrapResponse(response);
  return data?.profile || data?.faculty || data?.payload?.submitterProfile || data?.payload?.submitter_profile || form?.info || {};
};

const mergeProfiles = (...profiles) => {
  const merged = {};
  profiles.filter((profile) => profile && typeof profile === "object").forEach((profile) => {
    Object.entries(profile).forEach(([key, value]) => {
      if (String(merged[key] ?? "").trim()) return;
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        merged[key] = value;
      }
    });
  });
  return merged;
};

const responseDocs = (response = {}, fallbackDocs = {}) => {
  const data = unwrapResponse(response);
  return parseMaybeJson(data?.payload?.docs || data?.docs || data?.data?.payload?.docs || data?.data?.docs || fallbackDocs || {});
};

const formHasOldRows = (form = {}) =>
  Boolean(form && typeof form === "object" && Object.values(form).some((value) => Array.isArray(value) && value.some((row) => row && typeof row === "object" && Object.values(row).some((cell) => String(cell ?? "").trim() !== ""))));

const normalizeRows = (value) => {
  const parsed = parseMaybeJson(value);
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === "object") return [parsed];
  return [];
};

const sectionRows = (form = {}, section = {}) => {
  if (section.key === "innovRows") {
    const rows = normalizeRows(form.innovRows);
    if (rows.length) return rows;
    if (String(form.innovDetails ?? form.innovScore ?? "").trim()) {
      return [{
        method: form.innovMethod || form.innovativeMethod || "Innovative Teaching-Learning Methodologies",
        details: form.innovDetails,
        score: form.innovScore,
        hod: form.innovHod,
        director: form.innovDirector,
        dean: form.innovDean,
      }];
    }
  }
  const keys = section.sourceKeys || [section.key];
  for (const key of keys) {
    const rows = normalizeRows(form[key]);
    if (rows.length) return rows;
  }
  return [];
};

const rowHasData = (row = {}, section = {}) => {
  const fields = section.fields || [];
  const fieldHasData = fields.some(([, ...aliases]) => String(readFromAliases(row, aliases)).trim() !== "");
  const scoreHasData = ["faculty", "hod", "director", "dean", "vc"].some((role) => String(previousYearScore(row, role)).trim() !== "");
  return fieldHasData || scoreHasData || String(readFromAliases(row, REMARK_KEYS)).trim() !== "";
};

const normalizeSection = (form, section) => {
  const rows = sectionRows(form, section)
    .map((row, originalIndex) => ({ row, originalIndex }))
    .filter(({ row }) => rowHasData(row, section))
    .map(({ row, originalIndex }) => ({ ...row, __rowNo: originalIndex + 1 }));
  const scoreTotal = rows.reduce((total, row) => total + previousYearNumber(previousYearScore(row, "faculty")), 0);
  return {
    ...section,
    rows,
    totals: {
      faculty: clampScore(scoreTotal, section.max),
      hod: clampScore(rows.reduce((total, row) => total + previousYearNumber(previousYearScore(row, "hod")), 0), section.max),
      director: clampScore(rows.reduce((total, row) => total + previousYearNumber(previousYearScore(row, "director")), 0), section.max),
      dean: clampScore(rows.reduce((total, row) => total + previousYearNumber(previousYearScore(row, "dean")), 0), section.max),
      vc: clampScore(rows.reduce((total, row) => total + previousYearNumber(previousYearScore(row, "vc")), 0), section.max),
    },
  };
};

const groupedTotal = (sections, role, max) => {
  const groupTotals = {};
  let ungroupedTotal = 0;
  sections.forEach((section) => {
    const sectionTotal = previousYearNumber(section.totals?.[role]);
    if (section.summaryGroup) {
      groupTotals[section.summaryGroup] = (groupTotals[section.summaryGroup] || 0) + sectionTotal;
    } else {
      ungroupedTotal += sectionTotal;
    }
  });
  const grouped = Object.entries(groupTotals).reduce((total, [group, value]) => {
    const groupMax = sections.find((section) => section.summaryGroup === group)?.max || value;
    return total + clampScore(value, groupMax);
  }, 0);
  return clampScore(ungroupedTotal + grouped, max);
};

const readTotal = (totals = {}, aliases = []) => {
  const value = readFromAliases(totals, aliases);
  return String(value ?? "").trim() === "" ? null : previousYearNumber(value);
};

const normalizeDocFile = (file) => {
  if (!file) return null;
  if (typeof file === "string") return { fileName: file.split("/").pop() || "Document", fileUrl: getFileUrl(file), fileType: "", academicYear: "" };
  const url = firstPresent(file.url, file.file_url, file.fileUrl, file.path, file.location, file.document_url, file.documentUrl);
  return {
    fileName: firstPresent(file.name, file.file_name, file.fileName, file.original_name, file.originalName, String(url || "").split("/").pop(), "Document"),
    fileUrl: url ? getFileUrl(url) : "",
    fileType: firstPresent(file.type, file.file_type, file.fileType, file.mime_type, file.mimeType),
    academicYear: firstPresent(file.academic_year, file.academicYear, file.year),
    itemTitle: firstPresent(file.itemTitle, file.item_title, file.title, file.row_title),
  };
};

// 2025-2026 (and its equivalent spellings) used a two-part appraisal structure (Part A + Part
// B only, no Part C/D) that no longer exists in the live app. For those years the section/max
// configuration below is a best-effort reconstruction, so the reviewing authority's own
// submitted total is the authoritative record of what was actually approved that year -
// prefer it over a row-by-row recomputation, matching how reviewer totals (hod/director/dean/
// vc) are already preferred from stored values in reviewerTotals() below.
const isLegacyTwoPartAcademicYear = (academicYear = "") =>
  String(academicYear).replace(/\s+/g, "") === "2025-2026" ||
  String(academicYear).replace(/\s+/g, "") === "2025-26" ||
  String(academicYear).replace(/\s+/g, "") === "25-26";

const escapeRegExp = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const docKeyMatchesPrefix = (key = "", prefix = "") => {
  if (!prefix) return false;
  if (key === prefix) return true;
  if (key.startsWith(`${prefix}-`) || key.startsWith(`${prefix}_`)) return true;
  return new RegExp(`^${escapeRegExp(prefix)}\\d+$`).test(key);
};

const docsForSection = (docs = {}, section = {}, academicYear = "", part = "A", formType = "") => {
  const prefixes = [section.doc, section.key, ...(section.sourceKeys || [])].filter(Boolean);
  return Object.entries(docs || {}).flatMap(([docKey, value]) => {
    const key = String(docKey);
    if (!prefixes.some((prefix) => docKeyMatchesPrefix(key, prefix))) return [];
    const rowMatch = key.match(/(\d+)$/);
    return filesForDocValue(value).map(normalizeDocFile).filter((file) => {
      if (!file) return false;
      return !file.academicYear || !academicYear || String(file.academicYear) === String(academicYear);
    }).map((file) => ({
      ...file,
      academicYear: file.academicYear || academicYear,
      part,
      formType,
      sectionKey: section.key,
      sectionLabel: section.label,
      rowNo: rowMatch ? Number(rowMatch[1]) + 1 : "",
      itemTitle: file.itemTitle || "",
    }));
  });
};

const attachSectionDocs = (sections, docs, academicYear, part, formType) =>
  sections.map((section) => ({
    ...section,
    attachments: docsForSection(docs, section, academicYear, part, formType),
  }));

export const normalizePreviousYearReport = ({
  response,
  form: formOverride,
  docs: docsOverride,
  academicYear,
  formType,
  profile: profileOverride,
  partASections,
  partBSections,
  partAMax,
  partBMax,
  grandMax,
}) => {
  const fetchedForm = responseForm(response);
  const form = formHasOldRows(fetchedForm) ? fetchedForm : formOverride || fetchedForm;
  const totals = responseTotals(response);
  const profile = mergeProfiles(profileOverride, form?.info, responseProfile(response, form));
  const docs = responseDocs(response, docsOverride);
  const resolvedAcademicYear = academicYear || form?.info?.ay || unwrapResponse(response)?.academic_year || unwrapResponse(response)?.academicYear || "";
  const normalizedPartA = attachSectionDocs(partASections.map((section) => normalizeSection(form, section)), docs, resolvedAcademicYear, "A", formType);
  const normalizedPartB = attachSectionDocs(partBSections.map((section) => normalizeSection(form, section)), docs, resolvedAcademicYear, "B", formType);
  const partAFaculty = groupedTotal(normalizedPartA, "faculty", partAMax);
  const partBFaculty = groupedTotal(normalizedPartB, "faculty", partBMax);
  const partAHasFacultyScores = normalizedPartA.some((section) =>
    section.rows.some((row) => String(previousYearScore(row, "faculty")).trim() !== "")
  );
  const partBHasFacultyScores = normalizedPartB.some((section) =>
    section.rows.some((row) => String(previousYearScore(row, "faculty")).trim() !== "")
  );
  const storedGrand = readTotal(totals, ["grandTotal", "grand_total", "totalScore", "total_score", "total"]);
  const storedGrandMax = readTotal(totals, ["effectiveGrandMax", "effective_grand_max", "grandMax", "grand_max", "max"]);
  const storedPartA = readTotal(totals, ["partATotal", "part_a_total", "partA", "part_a_score"]);
  const storedPartB = readTotal(totals, ["partBTotal", "part_b_total", "partB", "part_b_score"]);
  // Prefer the total freshly computed from this report's own rows over a stored total whenever
  // there's actual row data to compute from — a stored generic total may have been calculated
  // against a different (e.g. current-year) section/max configuration and can be stale or wrong.
  // Exception: confirmed legacy two-part years (see isLegacyTwoPartAcademicYear above) — there
  // the stored total is the authoritative one, so it takes priority instead.
  const isLegacyYear = isLegacyTwoPartAcademicYear(resolvedAcademicYear);
  const displayPartA = isLegacyYear
    ? (storedPartA ?? partAFaculty)
    : (partAHasFacultyScores ? partAFaculty : (storedPartA ?? partAFaculty));
  const displayPartB = isLegacyYear
    ? (storedPartB ?? partBFaculty)
    : (partBHasFacultyScores ? partBFaculty : (storedPartB ?? partBFaculty));
  const displayGrand = isLegacyYear
    ? (storedGrand ?? clampScore(displayPartA + displayPartB, storedGrandMax || grandMax))
    : ((partAHasFacultyScores || partBHasFacultyScores)
      ? clampScore(displayPartA + displayPartB, storedGrandMax || grandMax)
      : (storedGrand ?? clampScore(displayPartA + displayPartB, grandMax)));
  const reviewerTotals = (role, prefix) => {
    const partA = readTotal(totals, [`${prefix}PartA`, `${prefix}_part_a`, `${prefix}_part_a_total`]) ?? groupedTotal(normalizedPartA, role, partAMax);
    const partB = readTotal(totals, [`${prefix}PartB`, `${prefix}_part_b`, `${prefix}_part_b_total`]) ?? groupedTotal(normalizedPartB, role, partBMax);
    const grand = readTotal(totals, [`${prefix}Total`, `${prefix}_total`, `${prefix}Grand`, `${prefix}_grand`]) ?? clampScore(partA + partB, storedGrandMax || grandMax);
    return { partA, partB, grand };
  };

  return {
    formType,
    academicYear: resolvedAcademicYear,
    profile,
    partA: { max: partAMax, sections: normalizedPartA },
    partB: { max: partBMax, sections: normalizedPartB },
    totals: {
      faculty: {
        partA: displayPartA,
        partB: displayPartB,
        grand: displayGrand,
        max: storedGrandMax || grandMax,
      },
      hod: reviewerTotals("hod", "hod"),
      director: reviewerTotals("director", "director"),
      dean: reviewerTotals("dean", "dean"),
      vc: reviewerTotals("vc", "vc"),
    },
    attachments: {
      partA: normalizedPartA.flatMap((section) => section.attachments),
      partB: normalizedPartB.flatMap((section) => section.attachments),
    },
    reviewLevels: ["faculty", "hod", "director", "dean", "vc"],
  };
};

export const previousYearCellValue = (row = {}, aliases = []) => readFromAliases(row, aliases);
export const previousYearRemarks = (row = {}) => readFromAliases(row, REMARK_KEYS);
