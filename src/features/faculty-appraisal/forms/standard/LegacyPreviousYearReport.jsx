import { SectionCard as SC } from "../../components";
import { clampScore, filesForDocValue } from "../../utils";
import { n } from "../../shared";
import PreviousYearReportActions from "../../../previousYearReport/components/PreviousYearReportActions";
import { normalizeEngineeringPreviousYearReport } from "../../../previousYearReport/normalizers/engineeringPreviousYearNormalizer";

const legacyScore = (row = {}) => {
  const keys = ["score", "self_score", "faculty_score", "selfScore", "facultyScore"];
  for (const key of keys) {
    const value = row?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") return value;
  }
  return "";
};

const legacyRows = (rows = []) => {
  const list = Array.isArray(rows) ? rows : rows ? [rows] : [];
  return list.length ? list : [{}];
};

const LEGACY_SCORE_KEYS = new Set([
  "score",
  "self_score",
  "faculty_score",
  "selfScore",
  "facultyScore",
  "hod",
  "hod_score",
  "hodScore",
  "center_head_score",
  "director",
  "director_score",
  "directorScore",
  "dean",
  "dean_score",
  "deanScore",
]);

const LEGACY_META_KEYS = new Set(["label", "max", "sectionMax", "section_max"]);

const legacyRowHasMeaningfulData = (row = {}) => {
  const entries = Object.entries(row || {});
  const hasScore = entries.some(([key, value]) =>
    LEGACY_SCORE_KEYS.has(key) && String(value ?? "").trim() && n(value) > 0
  );
  const hasUserValue = entries.some(([key, value]) =>
    !LEGACY_SCORE_KEYS.has(key) &&
    !LEGACY_META_KEYS.has(key) &&
    String(value ?? "").trim()
  );
  return hasScore || hasUserValue;
};

const legacySectionTotal = (sections) =>
  sections.reduce((total, section) => total + clampScore(legacyRows(section.rows)
    .filter((row) => Object.values(row || {}).some((value) => String(value ?? "").trim()))
    .reduce((sum, row) => sum + n(legacyScore(row)), 0), section.max), 0);

const legacySectionsHaveData = (sections) =>
  sections.some((section) => legacyRows(section.rows).some(legacyRowHasMeaningfulData));

const legacySectionsHaveScores = (sections) =>
  sections.some((section) => legacyRows(section.rows).some((row) =>
    String(legacyScore(row) ?? "").trim() !== ""
  ));

const legacyDocsHaveFiles = (docs = {}) =>
  Object.values(docs || {}).some((files) => filesForDocValue(files).length > 0);

export default function LegacyPreviousYearReport({
  academicYear = "2025-2026",
  profile,
  reviews = [],
  storedTotals,
  docs,
  lectures,
  courseFile,
  innovRows,
  projects,
  quals,
  feedback,
  deptActs,
  uniActs,
  society,
  industry,
  acr,
  journals,
  books,
  ict,
  research,
  projects2,
  externalProjects,
  patents,
  awards,
  confs,
  proposals,
  products,
  fdps,
  training,
}) {
  const partASections = [
    { max: 50, rows: lectures },
    { max: 20, rows: courseFile },
    { max: 10, rows: innovRows },
    { max: 10, rows: projects },
    { max: 10, rows: quals },
    { max: 10, rows: feedback },
    { max: 20, rows: deptActs },
    { max: 30, rows: uniActs },
    { max: 10, rows: society },
    { max: 5, rows: industry },
    { max: 25, rows: acr },
  ];
  const partBSections = [
    { max: 120, rows: journals },
    { max: 50, rows: books },
    { max: 20, rows: ict },
    { max: 30, rows: research },
    { max: 15, rows: projects2 },
    { max: 30, rows: externalProjects },
    { max: 40, rows: patents },
    { max: 10, rows: awards },
    { max: 30, rows: confs },
    { max: 10, rows: proposals },
    { max: 10, rows: products },
    { max: 10, rows: fdps },
    { max: 0, rows: training },
  ];
  const normalizedReport = normalizeEngineeringPreviousYearReport({
    form: {
      info: { ...(profile || {}), ay: academicYear },
      lectures,
      courseFile,
      innovRows,
      projects,
      quals,
      feedback,
      deptActs,
      uniActs,
      society,
      industry,
      acr,
      journals,
      books,
      ict,
      research,
      projects2,
      externalProjects,
      patents,
      awards,
      confs,
      proposals,
      products,
      fdps,
      training,
    },
    docs,
    academicYear,
    profile,
    response: { totals: storedTotals },
  });
  const calculatedPartA = clampScore(legacySectionTotal(partASections), 200);
  const calculatedPartB = clampScore(legacySectionTotal(partBSections), 375);
  const hasPartAScores = legacySectionsHaveScores(partASections);
  const hasPartBScores = legacySectionsHaveScores(partBSections);
  const facultyPartA = hasPartAScores ? calculatedPartA : clampScore(storedTotals?.partA, 200);
  const facultyPartB = hasPartBScores ? calculatedPartB : clampScore(storedTotals?.partB, 375);
  const grandFaculty = hasPartAScores || hasPartBScores
    ? clampScore(facultyPartA + facultyPartB, 575)
    : clampScore(storedTotals?.grand, 575);
  const hasStoredScore = [storedTotals?.partA, storedTotals?.partB, storedTotals?.grand]
    .some((value) => value !== null && value !== undefined && n(value) > 0);
  const hasPreviousRecord = hasStoredScore ||
    legacySectionsHaveData(partASections) ||
    legacySectionsHaveData(partBSections) ||
    legacyDocsHaveFiles(docs);

  if (!hasPreviousRecord) {
    return (
      <SC title={`Previous Year Appraisal Report - ${academicYear}`} accent="#4c1d95">
        <div style={{ border: "1px solid #fecaca", background: "#fef2f2", color: "#991b1b", borderRadius: 12, padding: "18px 20px", fontWeight: 800, lineHeight: 1.5 }}>
          We don't have your previous academic year records. Please contact support at appraisal@dypiu.ac.in.
        </div>
      </SC>
    );
  }

  return (
    <SC title={`Previous Year Appraisal Report - ${academicYear}`} accent="#4c1d95">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        {[
          ["Part A Faculty", `${facultyPartA.toFixed(1)} / 200`],
          ["Part B Faculty", `${facultyPartB.toFixed(1)} / 375`],
          ["Grand Faculty", `${grandFaculty.toFixed(1)} / 575`],
        ].map(([label, value]) => (
          <div key={label} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "11px 13px", background: "#f8fafc" }}>
            <div style={{ color: "#64748b", fontSize: 10, fontWeight: 900, textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</div>
            <div style={{ marginTop: 4, color: "#111827", fontSize: 15, fontWeight: 900 }}>{value}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 18 }}>
        <PreviousYearReportActions report={normalizedReport} title="Previous Year Appraisal Report" showSummary={false} reviews={reviews} />
      </div>
    </SC>
  );
}
