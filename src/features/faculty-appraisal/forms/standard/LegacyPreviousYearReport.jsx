import {
  SectionCard as SC,
  T,
  TD,
  TDC,
  TDS,
  TH,
  ViewCell,
} from "../../components";
import { clampScore, filesForDocValue } from "../../utils";
import { n, RO } from "../../shared";

const legacyScore = (row = {}, key = "score") => {
  const keys = key === "score"
    ? ["score", "self_score", "faculty_score", "selfScore", "facultyScore"]
    : [key, `${key}_score`, `${key}Score`];
  for (const scoreKey of keys) {
    const value = row?.[scoreKey];
    if (value !== undefined && value !== null && String(value).trim() !== "") return value;
  }
  return "";
};

const legacyRows = (rows = []) => {
  const list = Array.isArray(rows) ? rows : rows ? [rows] : [];
  return list.length ? list : [{}];
};

const legacyRowHasData = (row = {}) =>
  Object.values(row || {}).some((value) => String(value ?? "").trim());

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

const legacySectionTotal = (sections, scoreKey) =>
  sections.reduce((total, section) => total + clampScore(legacyRows(section.rows)
    .filter(legacyRowHasData)
    .reduce((sum, row) => sum + n(legacyScore(row, scoreKey)), 0), section.max), 0);

const legacySectionsHaveData = (sections) =>
  sections.some((section) => legacyRows(section.rows).some(legacyRowHasMeaningfulData));

const legacySectionsHaveScores = (sections) =>
  sections.some((section) => legacyRows(section.rows).some((row) =>
    String(legacyScore(row, "score") ?? "").trim() !== ""
  ));

const legacyDocsHaveFiles = (docs = {}) =>
  Object.values(docs || {}).some((files) => filesForDocValue(files).length > 0);

function LegacyReportTable({ title, accent = "#6366f1", rows, docs, docPrefix, columns = [], scoreMax }) {
  const displayRows = legacyRows(rows).filter(legacyRowHasData);

  return (
    <SC title={title} accent={accent}>
      <div style={{ overflowX: "auto" }}>
        <table style={T}>
          <thead>
            <tr>
              <th style={{ ...TH, width: 34 }}>SN</th>
              {columns.map((column) => <th key={column.label} style={column.center ? TDC : TH}>{column.label}</th>)}
              <th style={TH}>View Docs</th>
              <th style={TH}>Faculty Score</th>
            </tr>
          </thead>
          <tbody>
            {displayRows.length ? displayRows.map((row, index) => (
              <tr key={index} style={index % 2 ? { background: "#f8fafc" } : {}}>
                <td style={TDC}>{index + 1}</td>
                {columns.map((column) => (
                  <td key={column.label} style={column.center ? TDC : TD}>
                    <RO val={column.render ? column.render(row, index) : row?.[column.key]} center={column.center} />
                  </td>
                ))}
                <td style={TD}><ViewCell id={`${docPrefix}-${index}`} docs={docs} /></td>
                <td style={TDS}><RO val={scoreMax ? clampScore(legacyScore(row, "score"), scoreMax) || "" : legacyScore(row, "score")} center /></td>
              </tr>
            )) : (
              <tr>
                <td style={{ ...TD, textAlign: "center", color: "#94a3b8", fontWeight: 700 }} colSpan={columns.length + 3}>No records found for this section.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </SC>
  );
}

export default function LegacyPreviousYearReport({
  sectionView,
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
    { title: "A1. Lectures / Tutorials / Practicals (Max 50)", max: 50, accent: "#6366f1", rows: lectures, docPrefix: "lec", columns: [["Semester", "sem"], ["Course Code / Name", "code"], ["Classes (as per course structure)", "planned", true], ["Classes Actually Conducted", "conducted", true]] },
    { title: "A2. Course File (Max 20)", max: 20, accent: "#6366f1", rows: courseFile, docPrefix: "courseFile", columns: [["Course", "course"], ["Program & Semester", "title"], ["Availability as per IQAC format", "details", true]] },
    { title: "A3. Innovative Teaching-Learning (Max 10)", max: 10, accent: "#8b5cf6", rows: innovRows, docPrefix: "innov", columns: [["Method", "method"], ["Details", "details"]] },
    { title: "A4. Projects (Max 10)", max: 10, accent: "#8b5cf6", rows: projects, docPrefix: "proj", columns: [["Project Type", "label"], ["Details", "details"]] },
    { title: "A5. Qualification Enhancement (Max 10)", max: 10, accent: "#8b5cf6", rows: quals, docPrefix: "qual", columns: [["Description", "label"]] },
    { title: "B. Student Feedback (Max 10)", max: 10, accent: "#0ea5e9", rows: feedback, docPrefix: "feedback", columns: [["Course", "code"], ["First Feedback(%)", "fb1", true], ["Second Feedback(%)", "fb2", true], ["Average", "average", true, (row) => row.fb1 && row.fb2 ? ((n(row.fb1) + n(row.fb2)) / 2).toFixed(2) : ""]] },
    { title: "C. Departmental Activities (Max 20)", max: 20, accent: "#f59e0b", rows: deptActs, docPrefix: "dept", columns: [["Activity", "activity"], ["Nature", "nature"]] },
    { title: "D. University Activities (Max 30)", max: 30, accent: "#f59e0b", rows: uniActs, docPrefix: "uni", columns: [["Activity", "activity"], ["Nature", "nature"]] },
    { title: "E. Contribution to Society (Max 10)", max: 10, accent: "#10b981", rows: society, docPrefix: "soc", columns: [["Activity", "label"], ["Details", "details"]] },
    { title: "F. Industry Connect (Max 5)", max: 5, accent: "#10b981", rows: industry, docPrefix: "ind", columns: [["Industry Name", "name"], ["Details", "details"]] },
    { title: "G. Annual Confidential Report (Max 25)", max: 25, accent: "#ef4444", rows: acr, docPrefix: "acr", columns: [["Parameter", "label"]] },
  ];

  const partBSections = [
    { title: "B1. Research Papers / Journal Publications (Max 120)", max: 120, accent: "#7c3aed", rows: journals, docPrefix: "jour", columns: [["Title", "title"], ["Journal", "journal"], ["ISSN", "issn", true], ["Journal Indexing", "index", true]] },
    { title: "B2. Books / Book Chapters (Max 50)", max: 50, accent: "#7c3aed", rows: books, docPrefix: "book", columns: [["Title with Page Nos.", "title"], ["Book Title, Editor & Publisher", "book"], ["ISSN / ISBN No.", "issn", true], ["Type of Publisher", "pub"], ["Co-authors", "coauth"], ["First Author", "first", true]] },
    { title: "B3. ICT / E-Content / Pedagogy (Max 20)", max: 20, accent: "#0ea5e9", rows: ict, docPrefix: "ict", columns: [["Title", "title"], ["Type", "type"], ["Quadrants", "quad", true]] },
    { title: "B4(a). Research Guidance - PhD / PG (Max 30)", max: 30, accent: "#059669", rows: research, docPrefix: "res", columns: [["Degree", "degree", true], ["Student Name", "name"], ["Status", "thesis"]] },
    { title: "B4(b). Research / Consultancy Internal Projects (Max 15)", max: 15, accent: "#059669", rows: projects2, docPrefix: "project2", columns: [["Title", "title"], ["Funding Agency", "agency"], ["Date of Sanction", "date", true], ["Grant Amount", "amount", true], ["Role", "role"], ["Status", "status"]] },
    { title: "B4(c). Research / Consultancy External Projects (Max 30)", max: 30, accent: "#059669", rows: externalProjects, docPrefix: "externalProject", columns: [["Title", "title"], ["Funding Agency", "agency"], ["Date of Sanction", "date", true], ["Grant Amount", "amount", true], ["Role", "role"], ["Status", "status"]] },
    { title: "B5(a). Patents (IPR) (Max 40)", max: 40, accent: "#f97316", rows: patents, docPrefix: "pat", columns: [["Title", "title"], ["National / International", "type", true], ["Filed", "date", true], ["Status", "status", true], ["File No.", "fileNo", true]] },
    { title: "B5(b). Awards (Max 10)", max: 10, accent: "#f97316", rows: awards, docPrefix: "awd", columns: [["Award Title", "title"], ["Date", "date", true], ["Agency", "agency"], ["Level", "level"]] },
    { title: "B6. Invited Lectures / Resource Person / Paper Presentations (Max 30)", max: 30, accent: "#6366f1", rows: confs, docPrefix: "conf", columns: [["Title / Session", "title"], ["Type", "type"], ["Organizer", "org"], ["Level", "level"]] },
    { title: "B7(a). Submitted Research Proposals (Max 10)", max: 10, accent: "#0ea5e9", rows: proposals, docPrefix: "prop", columns: [["Title of Proposal", "title"], ["Duration", "duration", true], ["Funding Agency", "agency"], ["Grant Amount Requested", "amount", true]] },
    { title: "B7(b). Product Developed and Used by Students in Lab / Commercialized (Max 10)", max: 10, accent: "#0ea5e9", rows: products, docPrefix: "prod", columns: [["Details of Product", "details"], ["Used by Students in Lab / Commercialized", "usage"]] },
    { title: "B8(a). FDP / Workshops Attended (Max 10)", max: 10, accent: "#10b981", rows: fdps, docPrefix: "fdp", columns: [["Program", "program"], ["Duration", "duration", true], ["Organizer", "org"]] },
    { title: "B8(b). Industrial Training", max: 0, accent: "#10b981", rows: training, docPrefix: "train", columns: [["Company", "company"], ["Duration", "duration", true], ["Nature", "nature"]] },
  ];

  const sections = sectionView === "partB" ? partBSections : partASections;
  const calculatedPartA = clampScore(legacySectionTotal(partASections, "score"), 200);
  const calculatedPartB = clampScore(legacySectionTotal(partBSections, "score"), 375);
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
      <SC title="Previous Year Appraisal Report - 2025-2026" accent="#4c1d95">
        <div style={{ border: "1px solid #fecaca", background: "#fef2f2", color: "#991b1b", borderRadius: 12, padding: "18px 20px", fontWeight: 800, lineHeight: 1.5 }}>
          We don't have your previous academic year records. Please contact support at appraisal@dypiu.ac.in.
        </div>
      </SC>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <SC title="Previous Year Appraisal Report - 2025-2026" accent="#4c1d95">
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
      </SC>
      <div style={{ fontWeight: 800, fontSize: 13, color: "#1e293b", background: sectionView === "partB" ? "#ede9fe" : "#dbeafe", padding: "8px 14px", borderRadius: 6, letterSpacing: 0.3 }}>
        {sectionView === "partB" ? "PART B - Research & Academic Contributions" : "PART A - Teaching & Academic Activities"}
      </div>
      {sections.map((section) => (
        <LegacyReportTable
          key={section.title}
          {...section}
          columns={section.columns.map(([label, key, center, render]) => ({ label, key, center, render }))}
          docs={docs}
        />
      ))}
    </div>
  );
}
