/* eslint-disable no-unused-vars */
import { createContext, useContext, useState, useRef, useEffect } from "react";
import MyAppraisalForm from "../components/appraisal";
import { api } from "../services/api";
import { Avatar, CompactSummaryCard, ScoreBar, StatusBadge } from "../components/dashboard/dashboardPrimitives";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import { ACR_DETAIL_POINTS, SOCIETY_LABELS, MAX_SCORES, APP_INFO, createAcrRows, fetchSavedAppraisal, loadAppraisalDocuments, loadSavedAppraisal, mergeFacultyInfo, saveAppraisalDraftSection, submitAppraisal, fetchReviewQueueForRole, loadReviewerDraft, saveReviewerDraft, submitWorkflowReview, INNOVATIVE_METHODS, SCORE_LIMITS, averageSectionScore, clampScore, clampReviewScore, courseFileAverageScore, courseFileRowScore, effectiveMaxScore, feedbackAverage, feedbackRowScore, feedbackSectionScore, innovativeSelectionsFromDetails, innovativeTeachingScore, isAllowedAttachmentFile, isValidDDMMYYYY, maskDateDDMMYYYY, normalizeAutoScores, projectGuidanceRowMax, researchGuidanceRowMax, researchGuidanceScore, reviewSectionScore, rowHasReviewableData, scoreRemaining, selfEffectivePartAMax, societyRowLocked, societyRowScore, sumSectionScore, toggleInnovativeMethod, validateCompleteRows, generateStandardReport, standardSubmittedScoreSummary, AppraisalHeaderImage, SummaryOtherInfoField, summaryOtherInfoValueFrom, RejectionNotice, DocCell, ViewCell, ViewDocsCell, RowButtons as RowBtns, SectionSaveFooter, SectionCard as SC, T, TH, TH_HOD, TH_DIR, TH_DEAN, TD, TDC, TDS, TDS_HOD, TDS_DIR, TDS_DEAN, TDV, MyAppraisalSection, CreativeSchoolAuthorityReviewPanel, isCreativeSchool } from "../features/faculty-appraisal";
import { DEAN_TRACKS, getSchoolKey, getSchoolsByDeanTrack } from "../constants/universityHierarchy";
import { canReviewerRejectProfile, rejectedStatusFor, reviewedStatusFor, profileFromsessionStorage, workflowValidationError, roleLabel, isAppraisalFinalisedByVc, isRejectedStatus, isPendingReviewStatusFor, hasActiveRejection, reviewListFrom, getDeanTrack } from "../utils/hierarchy";
import { n, pct, grade, RO, TI } from "../features/faculty-appraisal/shared";

const ENGINEERING_SCHOOLS = getSchoolsByDeanTrack(DEAN_TRACKS.ENGINEERING);
const ENGINEERING_SCHOOL_VALUES = ENGINEERING_SCHOOLS.flatMap((school) => [
 school.code,
 school.name,
 school.label,
]);
const ENGINEERING_SCHOOL_CODES = ENGINEERING_SCHOOLS.map((school) => school.code);
const SCHOOL_VISUALS = {
 SoCSEA: { icon: "CS", color: "#6366f1", bg: "#eef2ff" },
 SoBB: { icon: "BB", color: "#10b981", bg: "#ecfdf5" },
 SoCE: { icon: "CE", color: "#0ea5e9", bg: "#eff6ff" },
 SoEMR: { icon: "EM", color: "#f59e0b", bg: "#fffbeb" },
 SoCM: { icon: "CM", color: "#14b8a6", bg: "#ecfeff" },
 SoMCS: { icon: "MC", color: "#6366f1", bg: "#eef2ff" },
 SoHSS: { icon: "HS", color: "#0f766e", bg: "#ecfdf5" },
 SoD: { icon: "SD", color: "#ec4899", bg: "#fdf2f8" },
 SoAA: { icon: "AA", color: "#7c3aed", bg: "#f3e8ff" },
};

// n, pct, grade, RO, TI → imported from shared
const preserveScrollAfterStateUpdate = (update) =>{
 const x = window.scrollX || 0;
 const y = window.scrollY || 0;
 update();
 requestAnimationFrame(() =>window.scrollTo(x, y));
};
// grade, RO → imported from shared
function DeanInput({ val, onChange, max, disabled = false }) {
 return (
<input type="number" min="0" step="0.5" value={val ?? ""}
 max={max}
 disabled={disabled}
 onChange={e =>onChange(e.target.value === "" || max === undefined ? e.target.value : String(clampScore(e.target.value, max)))}
 style={{ width: 74, height: 34, boxSizing: "border-box", textAlign: "center", border: disabled ? "1px solid #cbd5e1" : "1.5px solid #7c3aed", borderRadius: 9, padding: "6px 8px", fontSize: 13, fontFamily: "inherit", fontWeight: 800, color: disabled ? "#94a3b8" : "#111827", outline: "none", background: disabled ? "#f8fafc" : "#ffffff", cursor: disabled ? "not-allowed" : "text", boxShadow: disabled ? "none" : "0 0 0 3px rgba(124,58,237,0.08), 0 8px 18px rgba(124,58,237,0.08)", transition: "border-color 180ms ease, box-shadow 180ms ease, background 180ms ease" }}
 />
 );
}
function SelfInput({ val, onChange, max }) {
 return (
<input type="number" min="0" step="0.5" value={val ?? ""}
 max={max}
 onChange={e =>onChange(e.target.value === "" || max === undefined ? e.target.value : String(clampScore(e.target.value, max)))}
 style={{ width: 58, textAlign: "center", border: "1.5px solid #10b981", borderRadius: 5, padding: "3px 5px", fontSize: 11, fontFamily: "inherit", outline: "none", background: "#f0fff8" }}
 />
 );
}
// TI → imported from shared

function ReviewPanel({ faculty, onBack, onSubmit }) {
 const [hodData, setHodData] = useState({});
 const [remarks, setRemarks] = useState(faculty.hodRemarks || "");
 const [sectionView, setSectionView] = useState("partA");

 // Compute HOD total from hodData
 const calcHodScore = () =>{
 const get = (section, idx, field) =>{
 if (hodData[section]) {
 const s = hodData[section];
 return idx === null ? n(s[field]) : n(s[idx]?.[field]);
 }
 return idx === null ? n(faculty[section]?.[field]) : n(faculty[section]?.[idx]?.[field]);
 };
 const getS = (key) =>n(hodData[key] ?? faculty[key]);

 const lectureReviewRows = (faculty.lectures || []).map((row, i) =>({
 ...row,
 hod: hodData.lectures?.[i]?.hod ?? row.hod ?? "",
 }));
 const courseFileReviewRows = (faculty.courseFile || []).map((row, i) =>({
 ...row,
 hod: hodData.courseFile?.[i]?.hod ?? row.hod ?? "",
 }));
 const lec = reviewSectionScore("lectures", lectureReviewRows, 50, "hod");
 const cf = reviewSectionScore("courseFile", courseFileReviewRows, 20, "hod");
 const innov = getS("innovHod");
 const proj = (faculty.projects || []).reduce((a, _, i) =>a + get("projects", i, "hod"), 0);
 const qual = (faculty.quals || []).reduce((a, _, i) =>a + get("quals", i, "hod"), 0);
 const feedbackReviewRows = (faculty.feedback || []).map((row, i) =>({
 ...row,
 hod: hodData.feedback?.[i]?.hod ?? row.hod ?? "",
 }));
 const fb = reviewSectionScore("feedback", feedbackReviewRows, 10, "hod");
 const dept = (faculty.deptActs || []).reduce((a, _, i) =>a + get("deptActs", i, "hod"), 0);
 const uni = (faculty.uniActs || []).reduce((a, _, i) =>a + get("uniActs", i, "hod"), 0);
 const soc = (faculty.society || []).reduce((a, row, i) =>a + (societyRowLocked(row) ? 0 : get("society", i, "hod")), 0);
 const ind = (faculty.industry || []).reduce((a, _, i) =>a + get("industry", i, "hod"), 0);
 const acrT = (faculty.acr || []).reduce((a, _, i) =>a + clampScore(get("acr", i, "hod"), SCORE_LIMITS.acrRow), 0);
 const partA = lec + cf + innov + proj + qual + fb + dept + uni + soc + ind + acrT;

 const jour = (faculty.journals || []).reduce((a, _, i) =>a + get("journals", i, "hod"), 0);
 const bk = (faculty.books || []).reduce((a, _, i) =>a + get("books", i, "hod"), 0);
 const ictT = (faculty.ict || []).reduce((a, _, i) =>a + get("ict", i, "hod"), 0);
 const res = (faculty.research || []).reduce((a, _, i) =>a + get("research", i, "hod"), 0);
 const resProjects = clampScore((faculty.projects2 || []).reduce((a, _, i) =>a + get("projects2", i, "hod"), 0), SCORE_LIMITS.researchInternalProjects);
 const externalResProjects = clampScore((faculty.externalProjects || []).reduce((a, _, i) =>a + get("externalProjects", i, "hod"), 0), SCORE_LIMITS.researchExternalProjects);
 const pat = (faculty.patents || []).reduce((a, _, i) =>a + get("patents", i, "hod"), 0);
 const awd = (faculty.awards || []).reduce((a, _, i) =>a + get("awards", i, "hod"), 0);
 const conf = (faculty.confs || []).reduce((a, _, i) =>a + get("confs", i, "hod"), 0);
 const prop = (faculty.proposals || []).reduce((a, _, i) =>a + get("proposals", i, "hod"), 0);
 const prod = (faculty.products || []).reduce((a, _, i) =>a + get("products", i, "hod"), 0);
 const fdp = clampScore((faculty.fdps || []).reduce((a, _, i) =>a + clampScore(get("fdps", i, "hod"), SCORE_LIMITS.fdpRow), 0), 10);
 const train = clampScore((faculty.training || []).reduce((a, _, i) =>a + clampScore(get("training", i, "hod"), SCORE_LIMITS.fdpRow), 0), 10);
 const b8 = clampScore(fdp + train, 10);
 const partB = jour + bk + ictT + res + resProjects + externalResProjects + pat + awd + conf + prop + prod + b8;

 return { partA, partB, total: partA + partB };
 };

 const { partA, partB, total } = calcHodScore();
 const g = grade(total, 575);
 const facultySummary = standardSubmittedScoreSummary(faculty, {
 partA: faculty.lectures?.reduce((a, r) =>a + n(r.score), 0) || 0,
 partB: faculty.journals?.reduce((a, r) =>a + n(r.score), 0) || 0,
 });

 return (
<div style={{ display: "flex", flexDirection: "column", gap: 0, minHeight: "100%" }}>
 {/* Header */}
<div style={{ background: "#0f172a", padding: "14px 20px", display: "flex", alignItems: "center", gap: 14, marginBottom: 16, borderRadius: 10 }}>
<button onClick={onBack} style={{ background: "#1e293b", border: "none", color: "#94a3b8", cursor: "pointer", borderRadius: 6, padding: "6px 12px", fontSize: 12, fontFamily: "inherit" }}>Back</button>
<Avatar initials={faculty.avatar} color={faculty.avatarColor} size={40} />
<div style={{ flex: 1 }}>
<div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 15 }}>{faculty.name}</div>
<div style={{ color: "#64748b", fontSize: 11 }}>{faculty.designation} - {faculty.employeeId}</div>
</div>
<div style={{ display: "flex", gap: 10 }}>
<div style={{ background: "#1e293b", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
<div style={{ color: "#94a3b8", fontSize: 9, textTransform: "uppercase", letterSpacing: 0.6 }}>HOD Part A</div>
<div style={{ color: "#818cf8", fontWeight: 800, fontSize: 16 }}>{partA.toFixed(1)}</div>
</div>
<div style={{ background: "#1e293b", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
<div style={{ color: "#94a3b8", fontSize: 9, textTransform: "uppercase", letterSpacing: 0.6 }}>HOD Part B</div>
<div style={{ color: "#38bdf8", fontWeight: 800, fontSize: 16 }}>{partB.toFixed(1)}</div>
</div>
<div style={{ background: g.bg, border: `2px solid ${g.color}40`, borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
<div style={{ color: g.color, fontSize: 9, textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 700 }}>HOD Total</div>
<div style={{ color: g.color, fontWeight: 800, fontSize: 16 }}>{total.toFixed(1)}<span style={{ fontSize: 10, color: "#94a3b8" }}>/575</span></div>
</div>
</div>
</div>

 {/* Section switcher */}
<div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
 {[["partA", "Part A"], ["partB", "Part B"], ["partC", "Part C"], ["partD", "Part D"], ["summary", "Summary"]].map(([id, label]) =>(
<button key={id} onClick={() =>{
 setSectionView(id);
 requestAnimationFrame(() =>{
 window.scrollTo({ top: 0, left: 0, behavior: "auto" });
 });
 }}
 style={{ padding: "7px 18px", border: "none", borderRadius: 6, cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 700, background: sectionView === id ? "#312e81" : "#e2e8f0", color: sectionView === id ? "#e0e7ff" : "#475569" }}>
 {label}
</button>
 ))}
</div>

 {(sectionView === "partA" || sectionView === "partB") && (
<MyAppraisalForm faculty={faculty} hodData={hodData} setHodData={setHodData} sectionView={sectionView} />
 )}

 {sectionView === "summary" && (
<div style={{ background: "#fff", borderRadius: 10, padding: "22px 24px", boxShadow: "0 1px 6px rgba(0,0,0,.06)" }}>
<h3 style={{ margin: "0 0 16px", color: "#0f172a", fontSize: 15 }}>HOD Remarks & Final Submission</h3>

 {/* Score Summary */}
<table style={{ ...T, marginBottom: 18 }}>
<thead><tr>
<th style={TH}>Section</th><th style={TH}>Max</th>
<th style={TH}>Faculty Score</th><th style={TH_HOD}>HOD Score</th>
</tr></thead>
<tbody>
 {[["Part A - Teaching & Activities", facultySummary.partAMax, facultySummary.partA, partA],
 ["Part B - Research & Contributions", facultySummary.partBMax, facultySummary.partB, partB],
 ].map(([label, max, fac, hod]) =>(
<tr key={label}>
<td style={TD}>{label}</td>
<td style={TDC}>{max}</td>
<td style={TDS}>{fac.toFixed(1)}</td>
<td style={{ ...TDS_HOD, fontWeight: 700, color: "#312e81" }}>{hod.toFixed(1)}</td>
</tr>
 ))}
<tr style={{ background: "#d1fae5", fontWeight: 700 }}>
<td style={TD}>Grand Total</td>
<td style={TDC}>{facultySummary.grandMax}</td>
<td style={TDS}>{facultySummary.total.toFixed(1)}</td>
<td style={{ ...TDS_HOD, color: "#065f46", fontSize: 14 }}>{total.toFixed(1)}</td>
</tr>
</tbody>
</table>

<label style={{ fontWeight: 700, fontSize: 13, color: "#334155", display: "block", marginBottom: 6 }}>HOD Remarks</label>
<textarea value={remarks} onChange={e =>setRemarks(e.target.value)} rows={4}
 placeholder="Enter your remarks, observations, and recommendations for this faculty member..."
 style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: 7, padding: "10px 12px", fontSize: 12, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box", marginBottom: 16 }} />

<div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
<button onClick={onBack} style={{ padding: "9px 22px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 7, cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: "inherit" }}>Cancel</button>
<button onClick={() =>onSubmit(faculty.id, total, remarks)}
 disabled={!remarks.trim()}
 style={{ padding: "10px 28px", background: remarks.trim() ? "#059669" : "#64748b", color: "#fff", border: "none", borderRadius: 7, cursor: remarks.trim() ? "pointer" : "not-allowed", fontWeight: 700, fontSize: 13, fontFamily: "inherit" }}>
 ? Submit HOD Review
</button>
</div>
</div>
 )}
</div>
 );
}

const DEAN_REVIEW_PART_A_KEYS = ["lectures", "courseFile", "obeRows", "projects", "mentoringRows", "quals", "feedback"];
const DEAN_REVIEW_PART_B_KEYS = ["journals", "books", "patents", "projects2", "research", "proposals", "confs", "fdps", "awards", "products", "ict"];
const DEAN_REVIEW_PART_C_KEYS = ["uniActs", "deptActs", "eventRows", "society", "industry", "alumniRows", "placementRows"];
const DEAN_REVIEW_PART_D_KEYS = ["acr"];
const DEAN_REVIEW_ARRAY_KEYS = [...DEAN_REVIEW_PART_A_KEYS, ...DEAN_REVIEW_PART_B_KEYS, ...DEAN_REVIEW_PART_C_KEYS, ...DEAN_REVIEW_PART_D_KEYS];
const REVIEW_SCORE_FIELDS = ["hod", "director", "dean", "vc"];
const preserveSavedReviewScores = (form = {}, source = {}) =>{
 const merged = { ...form };
 merged.info = mergeFacultyInfo(form.info, source, form);
 DEAN_REVIEW_ARRAY_KEYS.forEach((key) =>{
 if (!Array.isArray(form[key])) return;
 const sourceRows = Array.isArray(source[key]) ? source[key] : [];
 merged[key] = form[key].map((row, index) =>{
 const sourceRow = sourceRows[index] || {};
 const next = { ...row };
 REVIEW_SCORE_FIELDS.forEach((field) =>{
 if (String(next[field] ?? "").trim() === "" && String(sourceRow[field] ?? "").trim() !== "") next[field] = sourceRow[field];
 });
 return next;
 });
 });
 ["innovHod", "innovDirector", "innovDean", "innovVc"].forEach((field) =>{
 if (String(merged[field] ?? "").trim() === "" && String(source[field] ?? "").trim() !== "") merged[field] = source[field];
 });
 if (Array.isArray(form.innovRows)) {
 const sourceRows = Array.isArray(source.innovRows) ? source.innovRows : [];
 merged.innovRows = form.innovRows.map((row, index) =>{
 const sourceRow = sourceRows[index] || {};
 const next = { ...row };
 REVIEW_SCORE_FIELDS.forEach((field) =>{
 if (String(next[field] ?? "").trim() === "" && String(sourceRow[field] ?? "").trim() !== "") next[field] = sourceRow[field];
 });
 return next;
 });
 }
 return merged;
};
const DEAN_SECTION_MAX = { lectures: 40, courseFile: 20, obeRows: 20, projects: 20, mentoringRows: 10, quals: 10, feedback: 10, uniActs: 50, deptActs: 30, eventRows: 20, society: 20, industry: 8, alumniRows: 10, placementRows: 20, acr: 50, journals: 100, books: 30, ict: 20, research: 20, projects2: 40, patents: 40, awards: 20, confs: 20, proposals: 20, products: 20, fdps: 20 };
const DEAN_ROW_MAX = { courseFile: () =>SCORE_LIMITS.courseFileRow, obeRows: (row) =>row.max || 20, projects: projectGuidanceRowMax, mentoringRows: (row) =>row.max || 10, quals: () =>SCORE_LIMITS.qualificationRow, feedback: () =>10, society: () =>SCORE_LIMITS.societyRow, acr: () =>SCORE_LIMITS.acrRow, research: researchGuidanceRowMax, fdps: () =>SCORE_LIMITS.fdpRow };

const deanScorePayload = (approval, deanData) =>{
 const payload = {};

 DEAN_REVIEW_ARRAY_KEYS.forEach((key) =>{
 const rows = Array.isArray(approval[key]) ? approval[key] : [];
 payload[key] = rows.map((row, index) =>({
 ...row,
 dean: key === "society" && societyRowLocked(row)
 ? "0"
 : clampReviewScore(key, row, deanData[key]?.[index]?.dean ?? row.dean ?? "", DEAN_SECTION_MAX[key] || 0),
 }));
 });

 const innovRows = Array.isArray(approval.innovRows) ? approval.innovRows : [];
 const reviewInnovRows = Array.isArray(deanData.innovRows) ? deanData.innovRows : [];
 const mergedInnovRows = innovRows.map((row, index) =>({
 ...row,
 dean: clampReviewScore("innovRows", row, reviewInnovRows[index]?.dean ?? row.dean ?? "", 10),
 }));
 const innovTotal = reviewSectionScore("innovRows", mergedInnovRows, 10, "dean");
 payload.innovRows = mergedInnovRows;
 payload.innovativeTeaching = {
 dean: innovTotal ? String(innovTotal) : deanData.innovativeTeaching?.dean ?? approval.innovDean ?? "",
 };

 return payload;
};

const sumDeanRows = (payload, keys) =>
 keys.reduce((total, key) =>{
 if (key === "lectures" || key === "courseFile" || key === "feedback") return total + reviewSectionScore(key, payload[key] || [], DEAN_SECTION_MAX[key] || 0, "dean");
 return total + clampScore((payload[key] || []).reduce((sum, row) =>{
 if (key === "society" && societyRowLocked(row)) return sum;
 if (!rowHasReviewableData(key, row)) return sum;
 const rowMax = DEAN_ROW_MAX[key]?.(row);
 return sum + (rowMax ? clampScore(row.dean, rowMax) : n(row.dean));
 }, 0), DEAN_SECTION_MAX[key] || 0);
 }, 0);

const deanScoreTotals = (payload) =>{
 const reviewerMaxScores = {
 partA: effectiveMaxScore(150),
 partB: effectiveMaxScore(350),
 partC: 150,
 partD: 50,
 grand: 0,
 };
reviewerMaxScores.grand = reviewerMaxScores.partA + reviewerMaxScores.partB + reviewerMaxScores.partC + reviewerMaxScores.partD;
 const innovativeScore = Array.isArray(payload.innovRows) && payload.innovRows.length
 ? reviewSectionScore("innovRows", payload.innovRows, 10, "dean")
 : clampScore(payload.innovativeTeaching?.dean, 10);
 const partA = clampScore(sumDeanRows(payload, DEAN_REVIEW_PART_A_KEYS) + innovativeScore, reviewerMaxScores.partA);
 const b8 = sumDeanRows(payload, ["fdps"]);
 const partBWithoutB8 = sumDeanRows(payload, DEAN_REVIEW_PART_B_KEYS.filter(k =>k !== "fdps"));
 const cappedPartB = clampScore(partBWithoutB8 + b8, reviewerMaxScores.partB);
 const partC = clampScore(sumDeanRows(payload, DEAN_REVIEW_PART_C_KEYS), reviewerMaxScores.partC);
 const partD = clampScore(sumDeanRows(payload, DEAN_REVIEW_PART_D_KEYS), reviewerMaxScores.partD);
 return { partA, partB: cappedPartB, partC, partD, total: clampScore(partA + cappedPartB + partC + partD, reviewerMaxScores.grand) };
};

function DeanScoreCell({ sectionKey, index, row, deanData, setDeanData }) {
 const value = deanData[sectionKey]?.[index]?.dean ?? row.dean ?? "";
 const maxForRow = DEAN_ROW_MAX[sectionKey]?.(row) || DEAN_SECTION_MAX[sectionKey];
 const societyLocked = sectionKey === "society" && societyRowLocked(row);
 const locked = societyLocked || !rowHasReviewableData(sectionKey, row);
 const displayValue = societyLocked ? "0" : locked ? "" : String(value ?? "").trim() ? clampScore(value, maxForRow) : "";

 const update = (nextValue) =>{
 const clampedValue = clampReviewScore(sectionKey, row, nextValue, DEAN_SECTION_MAX[sectionKey] || 0);
 preserveScrollAfterStateUpdate(() =>setDeanData((prev) =>{
 const baseRows = Array.isArray(prev[sectionKey]) ? prev[sectionKey] : [];
 const updatedRows = [...baseRows];
 updatedRows[index] = { ...(updatedRows[index] || row), dean: clampedValue };
 return { ...prev, [sectionKey]: updatedRows };
 }));
 };

 return<DeanInput val={displayValue} max={maxForRow} disabled={locked} onChange={update} />;
}

function DeanInnovativeScoreCell({ row, index, rows, deanData, setDeanData }) {
 const value = deanData.innovRows?.[index]?.dean ?? row.dean ?? "";
 const locked = !rowHasReviewableData("innovRows", row);
 const update = (nextValue) =>{
 const clampedValue = clampReviewScore("innovRows", row, nextValue, 10);
 preserveScrollAfterStateUpdate(() =>setDeanData((prev) =>{
 const baseRows = Array.isArray(prev.innovRows) && prev.innovRows.length ? prev.innovRows : rows;
 const updatedRows = [...baseRows];
 updatedRows[index] = { ...(updatedRows[index] || row), dean: clampedValue };
 const totalRows = updatedRows.map((item, rowIndex) =>({ ...item, ...(rowIndex === index ? row : {}) }));
 const total = reviewSectionScore("innovRows", totalRows, 10, "dean");
 return {
 ...prev,
 innovRows: updatedRows,
 innovativeTeaching: { ...(prev.innovativeTeaching || {}), dean: total ? String(total) : "" },
 };
 }));
 };
 return (
<DeanInput
 val={String(value ?? "").trim() ? clampScore(value, SCORE_LIMITS.innovativeRow) : ""}
 max={SCORE_LIMITS.innovativeRow}
 disabled={locked}
 onChange={update}
 />
 );
}

const DeanReviewTableContext = createContext(null);

function ReviewTable({ title, accent = "#4338ca", sectionKey, columns, docPrefix, rows: sectionRows }) {
  const ctx = useContext(DeanReviewTableContext);
  if (!ctx) return null;
  const dataRows = sectionRows || ctx.rows(sectionKey);
  const hasDocs = Boolean(docPrefix);
  const totalColumns = 1 + columns.length + (hasDocs ? 1 : 0) + 2;

  return (
    <SC title={title} accent={accent}>
      <div style={{ overflowX: "auto" }}>
        <table style={T}>
          <thead>
            <tr>
              <th style={TH}>SN</th>
              {columns.map((column) => (
                <th key={column.label} style={TH}>{column.label}</th>
              ))}
              {hasDocs && <th style={TH}>View Docs</th>}
              {ctx.scoreHeaders}
            </tr>
          </thead>
          <tbody>
            {dataRows.length ? dataRows.map((row, index) => (
              <tr key={`${sectionKey}-${index}`} style={sectionKey === "society" && societyRowLocked(row) ? { background: "#f1f5f9", opacity: 0.65 } : index % 2 ? { background: "#f8fafc" } : {}}>
                <td style={TDC}>{index + 1}</td>
                {columns.map((column) => (
                  <td key={column.label} style={column.center ? TDC : TD}>
                    {ctx.cell(column.render(row), column.center)}
                  </td>
                ))}
                {hasDocs && <td style={TDV}><ViewDocsCell docKey={`${docPrefix}-${index}`} docs={ctx.docs} /></td>}
                <td style={TDS}>{ctx.cell(sectionKey === "research" ? (row.degree || row.name || row.thesis || row.score ? researchGuidanceScore(row).toFixed(1) : "") : sectionKey === "society" ? (String(row.score ?? "").trim() ? societyRowScore(row) : "") : row.score, true)}</td>
                <td style={TDS_DEAN}><DeanScoreCell sectionKey={sectionKey} index={index} row={row} deanData={ctx.deanData} setDeanData={ctx.setDeanData} /></td>
              </tr>
            )) : (
              <tr>
                <td style={{ ...TDC, color: "#94a3b8", fontStyle: "italic" }} colSpan={totalColumns}>
                  No submitted rows for this table.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </SC>
  );
}

function DeanReviewScoreForm({ approval, deanData, setDeanData, sectionView = "partA" }) {
  const info = mergeFacultyInfo(approval.info, approval);
  const docs = approval.docs || {};
  const rows = (key) => Array.isArray(approval[key]) ? approval[key] : [];
  const cell = (value, center = false) => <RO val={value} center={center} />;
  const innovativeRows = Array.isArray(approval.innovRows) && approval.innovRows.length
    ? approval.innovRows
    : [{ method: approval.innovDetails || "Innovative / participatory teaching methods", details: approval.innovDetails || "", score: approval.innovScore || "" }];

  const scoreHeaders = (
    <>
      <th style={TH}>Faculty Score</th>
      <th style={TH_DEAN}>Dean Score</th>
    </>
  );

  return (
    <DeanReviewTableContext.Provider value={{ approval, deanData, docs, rows, scoreHeaders, setDeanData, cell }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        <div style={{ background: "linear-gradient(90deg,#312e81,#4338ca)", color: "#ede9fe", borderRadius: 8, padding: "10px 16px", marginBottom: 14, fontSize: 12 }}>
          <strong>Dean Review Mode</strong> - Faculty self-scores are read-only. Only the Dean score column is editable.
        </div>

        <SC title="Faculty Information" accent="#4338ca">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <tbody>
              {[["Name", info.name || approval.name], ["Qualification", info.qual], ["Designation", info.desig || approval.designation], ["Academic Year", approval.academicYear || info.ay]].map(([label, value]) => (
                <tr key={label}>
                  <td style={{ padding: "6px 10px", background: "#f8fafc", fontWeight: 600, border: "1px solid #e2e8f0", width: "35%" }}>{label}</td>
                  <td style={{ padding: "5px 10px", border: "1px solid #e2e8f0", color: "#334155" }}>{value || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </SC>

        {sectionView === "partA" && (
          <div className="review-part-stack">
            <div className="review-part-stack__title">Part A - Teaching & Academic Activities</div>

            <ReviewTable
              title="A1. Course Delivery & Classroom Engagement"
              accent="#4338ca"
              sectionKey="lectures"
              docPrefix="lec"
              columns={[
                { label: "Semester", render: (r) => r.sem },
                { label: "Course Code / Name", render: (r) => r.code },
                { label: "Classes (as per course structure)", render: (r) => r.planned, center: true },
                { label: "Classes Actually Conducted", render: (r) => r.conducted, center: true },
                { label: "% Conducted", render: (r) => r.pctConducted || (Number(r.planned) > 0 && Number(r.conducted) >= 0 ? `${((Number(r.conducted) / Number(r.planned)) * 100).toFixed(1)}%` : ""), center: true },
              ]}
            />

            <ReviewTable
              title="A2. Course File & Curriculum Documentation"
              accent="#4338ca"
              sectionKey="courseFile"
              docPrefix="courseFile"
              columns={[
                { label: "Course / Paper", render: (r) => r.course },
                { label: "Title", render: (r) => r.title },
                { label: "IQAC Index Compliance (Yes/No, with proof)", render: (r) => r.details },
              ]}
            />

<SC title="A3. Innovative Teaching-Learning Methods" accent="#4338ca">
<table style={T}>
<thead>
<tr>
<th style={TH}>SN</th>
<th style={TH}>Method</th>
<th style={TH}>Proof Attached (Yes/No)</th>
<th style={TH}>View Docs</th>
<th style={TH}>Self Score</th>
<th style={TH_DEAN}>Dean</th>
</tr>
</thead>
<tbody>
 {innovativeRows.map((row, index) =>(
<tr key={`innov-${index}`}>
<td style={TDC}>{index + 1}</td>
<td style={TD}><RO val={row.method || approval.innovDetails} /></td>
<td style={TD}><RO val={row.details} /></td>
<td style={TDV}><ViewDocsCell docKey={index === 0 ? ["innov", "innov-0"] : `innov-${index}`} docs={docs} /></td>
<td style={TDS}><RO val={String(row.score ?? "").trim() ? clampScore(row.score, SCORE_LIMITS.innovativeRow) : ""} center /></td>
<td style={TDS_DEAN}><DeanInnovativeScoreCell row={row} index={index} rows={innovativeRows} deanData={deanData} setDeanData={setDeanData} /></td>
</tr>
 ))}
</tbody>
</table>
</SC>

<ReviewTable
 title="A4. Student Feedback Score"
 accent="#0ea5e9"
 sectionKey="feedback"
 columns={[
 { label: "Course", render: (r) =>r.code },
 { label: "First Feedback(%)", render: (r) =>r.fb1, center: true },
 { label: "Second Feedback(%)", render: (r) =>r.fb2, center: true },
 { label: "Average", render: (r) =>r.fb1 && r.fb2 ? ((n(r.fb1) + n(r.fb2)) / 2).toFixed(2) : "", center: true },
 ]}
 />

<ReviewTable
 title="A5. Learning Outcomes Attainment & OBE Practice"
 accent="#2563eb"
 sectionKey="obeRows"
 docPrefix="obe"
 columns={[
 { label: "Component", render: (r) =>r.component },
 { label: "Evidence Attached (Yes/No)", render: (r) =>r.evidence, center: true },
 ]}
 />

<ReviewTable
 title="A6. Student Project Guidance"
 accent="#8b5cf6"
 sectionKey="projects"
 docPrefix="proj"
 columns={[
 { label: "Project Title / Batch", render: (r) =>r.label },
 { label: "No. of Students", render: (r) =>r.studentsCount, center: true },
 { label: "Industry Collab (Y/N)", render: (r) =>r.industryCollab, center: true },
 { label: "Award (Y/N)", render: (r) =>r.awardReceived, center: true },
 { label: "Student Pub (Y/N)", render: (r) =>r.studentPub, center: true },
 ]}
 />

<ReviewTable
 title="A7. Student Mentoring & Counselling"
 accent="#8b5cf6"
 sectionKey="mentoringRows"
 docPrefix="mentor"
 columns={[
 { label: "Activity", render: (r) =>r.activity },
 { label: "Evidence Attached (Yes/No)", render: (r) =>r.evidence, center: true },
 ]}
 />

<ReviewTable
 title="A8. Professional Development & Qualification Enhancement"
 accent="#8b5cf6"
 sectionKey="quals"
 docPrefix="qual"
 columns={[{ label: "Description", render: (r) =>r.label }]}
 />

</div>)}
 {sectionView === "partC" && (<div className="review-part-stack">
<div className="review-part-stack__title">Part C - Administrative Role & University Development Contribution</div>

<ReviewTable
 title="C1. Administration at University Level"
 accent="#0f766e"
 sectionKey="uniActs"
 docPrefix="uni"
 columns={[
 { label: "Activity / Responsibility", render: (r) =>r.activity },
 { label: "Duration Category", render: (r) =>r.nature },
 { label: "Period", render: (r) =>r.period },
 ]}
 />

<ReviewTable
 title="C2. Administration at School Level"
 accent="#0f766e"
 sectionKey="deptActs"
 docPrefix="dept"
 columns={[
 { label: "Activity / Responsibility", render: (r) =>r.activity },
 { label: "Duration Category", render: (r) =>r.nature },
 { label: "Period", render: (r) =>r.period },
 ]}
 />

<ReviewTable
 title="C3. Event Organisation & Institutional Visibility"
 accent="#0f766e"
 sectionKey="eventRows"
 docPrefix="event"
 columns={[
 { label: "Event / Contribution", render: (r) =>r.event },
 { label: "Role", render: (r) =>r.role },
 { label: "Date", render: (r) =>r.date },
 { label: "Level", render: (r) =>r.level },
 ]}
 />

<ReviewTable
 title="C4. Outreach, Extension & Social Responsibility"
 accent="#10b981"
 sectionKey="society"
 docPrefix="soc"
 columns={[
 { label: "Activity", render: (r) =>r.label },
 { label: "Details", render: (r) =>r.details },
 { label: "Date", render: (r) =>r.date },
 ]}
 />

<ReviewTable
 title="C5. Industry Interaction & Linkages"
 accent="#10b981"
 sectionKey="industry"
 docPrefix="ind"
 columns={[
 { label: "Activity", render: (r) =>r.activity || r.name },
 { label: "Industry Partner", render: (r) =>r.partner || r.details },
 { label: "Date", render: (r) =>r.date },
 ]}
 />

<ReviewTable
 title="C6. Alumni Engagement & Networking"
 accent="#0f766e"
 sectionKey="alumniRows"
 docPrefix="alumni"
 columns={[
 { label: "Activity", render: (r) =>r.activity },
 { label: "Details", render: (r) =>r.details },
 { label: "Date", render: (r) =>r.date },
 ]}
 />

<ReviewTable
 title="C7. Student Placement Mentoring & Career Development"
 accent="#0f766e"
 sectionKey="placementRows"
 docPrefix="placement"
 columns={[
 { label: "Activity Type", render: (r) =>r.activityType },
 { label: "Student / Company Name", render: (r) =>r.name },
 { label: "Date", render: (r) =>r.date },
 ]}
 />
</div>)}

 {sectionView === "partD" && (<div className="review-part-stack">
<div className="review-part-stack__title">Part D - Annual Confidential Report</div>

<ReviewTable
 title="D1. Annual Confidential Report (ACR)"
 accent="#ef4444"
 sectionKey="acr"
 columns={[{ label: "Parameter", render: (r) =>r.label }]}
 />
</div>)}

 {sectionView === "partB" && (<div className="review-part-stack">
<div className="review-part-stack__title">Part B - Research & Innovation</div>

<ReviewTable
 title="B1. Journal Publications"
 accent="#7c3aed"
 sectionKey="journals"
 docPrefix="jour"
 columns={[
 { label: "Title", render: (r) =>r.title },
 { label: "Journal", render: (r) =>r.journal },
 { label: "ISSN", render: (r) =>r.issn, center: true },
 { label: "Impact Factor", render: (r) =>r.impactFactor || r.impact, center: true },
 { label: "Author Position", render: (r) =>r.authorPosition || r.position, center: true },
 ]}
 />

<ReviewTable
 title="B2. Books, Book Chapters & Edited Volumes"
 accent="#7c3aed"
 sectionKey="books"
 docPrefix="book"
 columns={[
 { label: "Title", render: (r) =>r.title },
 { label: "Publisher & ISBN", render: (r) =>r.book || r.publisherIsbn },
 { label: "Type (Book/Chapter/Editor/Translation)", render: (r) =>r.pub || r.type },
 { label: "Level (Intl./National/Local)", render: (r) =>r.level },
 { label: "Co-authors from DYPIU", render: (r) =>r.coauth },
 ]}
 />

<ReviewTable
 title="B3. Patents, Copyrights & IP and Product Development"
 accent="#f97316"
 sectionKey="patents"
 docPrefix="pat"
 columns={[
 { label: "Title", render: (r) =>r.title },
 { label: "National / International", render: (r) =>r.type || r.level, center: true },
 { label: "Status (Published/Granted)", render: (r) =>r.status, center: true },
 { label: "Filing / Grant No. & Date", render: (r) =>r.fileNo || r.date, center: true },
 ]}
 />

<ReviewTable
 title="B4. Funded Research Projects"
 accent="#059669"
 sectionKey="projects2"
 docPrefix="project2"
 columns={[
 { label: "Title of Project", render: (r) =>r.title },
 { label: "Funding Agency", render: (r) =>r.agency },
 { label: "Sanction Date", render: (r) =>r.date, center: true },
 { label: "Amount (₹)", render: (r) =>r.amount, center: true },
 { label: "PI / Co-PI", render: (r) =>r.role },
 { label: "Status", render: (r) =>r.status },
 ]}
 />

<ReviewTable
 title="B5. Research Guidance"
 accent="#059669"
 sectionKey="research"
 docPrefix="res"
 columns={[
 { label: "Degree (PhD/PG)", render: (r) =>r.degree, center: true },
 { label: "Name of Student / Scholar", render: (r) =>r.name },
 { label: "Status (Ongoing/Awarded)", render: (r) =>r.status || r.thesis },
 { label: "Date", render: (r) =>r.date, center: true },
 ]}
 />

<ReviewTable
 title="B6. Consultancy, Testing & Training"
 accent="#0ea5e9"
 sectionKey="proposals"
 docPrefix="prop"
 columns={[
 { label: "Client / Organisation", render: (r) =>r.agency || r.title },
 { label: "Nature of Engagement", render: (r) =>r.duration || r.nature },
 { label: "Revenue Generated (₹)", render: (r) =>r.amount || r.revenue, center: true },
 ]}
 />

<ReviewTable
 title="B7. Conference / FDP / Training / Workshop Contributions Organised"
 accent="#6366f1"
 sectionKey="confs"
 docPrefix="conf"
 columns={[
 { label: "Event / Session Title", render: (r) =>r.title },
 { label: "Role", render: (r) =>r.role || r.type },
 { label: "Date", render: (r) =>r.date, center: true },
 { label: "Level (Intl./National)", render: (r) =>r.level || r.org },
 ]}
 />

<ReviewTable
 title="B8. Conference / FDP / Industry Training - Attended"
 accent="#10b981"
 sectionKey="fdps"
 docPrefix="fdp"
 columns={[
 { label: "Programme / Event", render: (r) =>r.program },
 { label: "Duration", render: (r) =>r.duration, center: true },
 { label: "Organised By", render: (r) =>r.org },
 ]}
 />

<ReviewTable
 title="B9. Research Awards, Fellowships, Reviewer of Journal & Citations"
 accent="#f97316"
 sectionKey="awards"
 docPrefix="awd"
 columns={[
 { label: "Title of Award / Fellowship / Metric", render: (r) =>r.title },
 { label: "Awarding Agency", render: (r) =>r.agency },
 { label: "Level", render: (r) =>r.level },
 { label: "Date", render: (r) =>r.date, center: true },
 ]}
 />

<ReviewTable
 title="B10. Innovation, Start-ups & Technology Transfer"
 accent="#0ea5e9"
 sectionKey="products"
 docPrefix="prod"
 columns={[
 { label: "Title / Start-up / Product", render: (r) =>r.details || r.title },
 { label: "Role", render: (r) =>r.role || r.usage },
 { label: "Status", render: (r) =>r.status },
 ]}
 />

<ReviewTable
 title="B11. ICT Content, MOOCs & E-Learning"
 accent="#0ea5e9"
 sectionKey="ict"
 docPrefix="ict"
 columns={[
 { label: "Title", render: (r) =>r.title },
 { label: "Platform / Type", render: (r) =>r.type || r.desc },
 { label: "Reach / Views (if available)", render: (r) =>r.quad || r.reach },
 ]}
 />

</div>)}
</div>
</DeanReviewTableContext.Provider>
 );
}

function ApprovalReviewPanel({ approval, approvalType, onBack, onSubmit, readOnly = false }) {
  if (isCreativeSchool(approval)) {
    return (
      <CreativeSchoolAuthorityReviewPanel
        person={approval}
        reviewerRole="dean"
        onBack={onBack}
        onSubmit={onSubmit}
        readOnly={readOnly}
        showReport={true}
      />
    );
  }
 const [remarks, setRemarks] = useState(approval?.deanRemarks || "");
 const [deanData, setDeanData] = useState({});
 const [sectionView, setSectionView] = useState("partA");
 const [reviewConfirmed, setReviewConfirmed] = useState(false);
 const [draftStatus, setDraftStatus] = useState("");
 const [savingDraft, setSavingDraft] = useState(false);
 const finalisedByVc = isAppraisalFinalisedByVc(approval);
 const pendingThisReviewer = isPendingReviewStatusFor([approval?.status, approval?.workflowStatus, approval?.workflow_status], "dean");
 const reviewLocked = finalisedByVc || readOnly || (!pendingThisReviewer && (approval?.status === "Reviewed" || /Dean\s*(Reviewed|Approved|Rejected)/i.test(approval?.status || "")));
 const canReject = canReviewerRejectProfile("dean", approval);
 const subjectEmail = approval?.email || approval?.faculty_email || approval?.facultyEmail;
 const academicYear = approval?.academicYear || approval?.academic_year || approval?.info?.ay || APP_INFO.DEFAULT_AY || "2026-2027";
 const sectionScores = deanScorePayload(approval, deanData);
 const reviewerMaxScores = {
 partA: effectiveMaxScore(150),
 partB: effectiveMaxScore(350),
 partC: 150,
 partD: 50,
 grand: 0,
 };
 reviewerMaxScores.grand = reviewerMaxScores.partA + reviewerMaxScores.partB + reviewerMaxScores.partC + reviewerMaxScores.partD;
 const deanScores = deanScoreTotals(sectionScores);
 const hasSavedDeanScores = ["deanPartA", "deanPartB", "deanPartC", "deanPartD", "deanTotal"].some((key) =>String(approval?.[key] ?? "").trim() !== "");
 const rawDisplayedDeanScores = reviewLocked && hasSavedDeanScores ? {
 partA: String(approval?.deanPartA ?? "").trim() !== "" ? n(approval?.deanPartA) : deanScores.partA,
 partB: String(approval?.deanPartB ?? "").trim() !== "" ? n(approval?.deanPartB) : deanScores.partB,
 partC: String(approval?.deanPartC ?? "").trim() !== "" ? n(approval?.deanPartC) : deanScores.partC,
 partD: String(approval?.deanPartD ?? "").trim() !== "" ? n(approval?.deanPartD) : deanScores.partD,
 total: String(approval?.deanTotal ?? "").trim() !== "" ? n(approval?.deanTotal) : deanScores.total,
 } : deanScores;
 const displayedDeanScores = {
 partA: clampScore(rawDisplayedDeanScores.partA, reviewerMaxScores.partA),
 partB: clampScore(rawDisplayedDeanScores.partB, reviewerMaxScores.partB),
 partC: clampScore(rawDisplayedDeanScores.partC, reviewerMaxScores.partC),
 partD: clampScore(rawDisplayedDeanScores.partD, reviewerMaxScores.partD),
 total: clampScore(rawDisplayedDeanScores.total || rawDisplayedDeanScores.partA + rawDisplayedDeanScores.partB + rawDisplayedDeanScores.partC + rawDisplayedDeanScores.partD, reviewerMaxScores.grand),
 };
 const selfSummary = standardSubmittedScoreSummary(approval);
 const titleMap = {
 hodApprovals: "HOD's Appraisal Review",
 directorApprovals: "Director's Appraisal Review",
 facultyApprovals: "Faculty's Appraisal Review",
 };
 useEffect(() =>{
 let active = true;
 if (reviewLocked || !subjectEmail) return undefined;
 loadReviewerDraft({ subjectEmail, academicYear, reviewerRole: "dean" })
 .then((draft) =>{
 if (!active || !draft?.payload) return;
 setDeanData(draft.payload.section_scores || {});
 setRemarks(draft.payload.remarks ?? "");
 setDraftStatus(draft.updated_at ? `Last saved: ${new Date(draft.updated_at).toLocaleString()}` : "Draft loaded");
 })
 .catch((err) =>{
 if (!active) return;
 console.error("Could not load reviewer draft:", err);
 setDraftStatus(err?.message || "Could not load draft.");
 });
 return () =>{ active = false; };
 }, [academicYear, reviewLocked, subjectEmail]);

 const handleSaveDraft = async () =>{
 try {
 setSavingDraft(true);
 await saveReviewerDraft({
 subjectEmail,
 academicYear,
 reviewerRole: "dean",
 partAScore: displayedDeanScores.partA,
 partBScore: displayedDeanScores.partB,
 partCScore: displayedDeanScores.partC,
 partDScore: displayedDeanScores.partD,
 totalScore: displayedDeanScores.total,
 remarks,
 sectionScores,
 });
 setDraftStatus(`Draft saved: ${new Date().toLocaleString()}`);
 } catch (err) {
 console.error("Could not save reviewer draft:", err);
 alert(err?.message || "Unable to save draft.");
 } finally {
 setSavingDraft(false);
 }
 };

 return (
<div style={{ background: "#fff", borderRadius: 14, padding: "24px", boxShadow: "0 18px 45px rgba(15,23,42,0.18)", minHeight: "100%" }}>
<div style={{ background: "linear-gradient(135deg,#0f172a 0%,#312e81 58%,#4c1d95 100%)", borderRadius: 14, padding: "16px 18px", marginBottom: 16, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", boxShadow: "0 18px 42px rgba(15,23,42,0.20)", border: "1px solid rgba(255,255,255,0.08)" }}>
<button onClick={onBack} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.08)", color: "#cbd5e1", cursor: "pointer", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontFamily: "inherit", fontWeight: 700 }}>Back</button>
<Avatar initials={approval.avatar} color={approval.avatarColor} size={40} />
<div style={{ flex: 1, minWidth: 220 }}>
<div style={{ color: "#c4b5fd", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 2 }}>{titleMap[approvalType]}</div>
<div style={{ color: "#f8fafc", fontWeight: 800, fontSize: 15 }}>{approval.name}</div>
<div style={{ color: "#c4b5fd", fontSize: 11 }}>{approval.designation || "-"} - {approval.employeeId || "No ID"}</div>
</div>
<div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
<div style={{ background: "rgba(30,27,75,0.78)", border: "1px solid rgba(196,181,253,0.16)", borderRadius: 10, padding: "8px 14px", textAlign: "center", minWidth: 92 }}>
<div style={{ color: "#c4b5fd", fontSize: 9, textTransform: "uppercase", letterSpacing: 0.6 }}>Dean Part A</div>
<div style={{ color: "#a78bfa", fontWeight: 900, fontSize: 16 }}>{displayedDeanScores.partA.toFixed(1)}</div>
</div>
<div style={{ background: "rgba(30,27,75,0.78)", border: "1px solid rgba(196,181,253,0.16)", borderRadius: 10, padding: "8px 14px", textAlign: "center", minWidth: 92 }}>
<div style={{ color: "#c4b5fd", fontSize: 9, textTransform: "uppercase", letterSpacing: 0.6 }}>Dean Part B</div>
<div style={{ color: "#38bdf8", fontWeight: 900, fontSize: 16 }}>{displayedDeanScores.partB.toFixed(1)}</div>
</div>
<div style={{ background: "rgba(30,27,75,0.78)", border: "1px solid rgba(196,181,253,0.16)", borderRadius: 10, padding: "8px 14px", textAlign: "center", minWidth: 92 }}>
<div style={{ color: "#c4b5fd", fontSize: 9, textTransform: "uppercase", letterSpacing: 0.6 }}>Dean Part C</div>
<div style={{ color: "#2dd4bf", fontWeight: 900, fontSize: 16 }}>{displayedDeanScores.partC.toFixed(1)}</div>
</div>
<div style={{ background: "rgba(30,27,75,0.78)", border: "1px solid rgba(196,181,253,0.16)", borderRadius: 10, padding: "8px 14px", textAlign: "center", minWidth: 92 }}>
<div style={{ color: "#c4b5fd", fontSize: 9, textTransform: "uppercase", letterSpacing: 0.6 }}>Dean Part D</div>
<div style={{ color: "#f59e0b", fontWeight: 900, fontSize: 16 }}>{displayedDeanScores.partD.toFixed(1)}</div>
</div>
<div style={{ background: "#fff1f2", border: "2px solid #fb718540", borderRadius: 10, padding: "8px 14px", textAlign: "center", minWidth: 100 }}>
<div style={{ color: "#e11d48", fontSize: 9, textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 800 }}>Dean Total</div>
<div style={{ color: "#e11d48", fontWeight: 900, fontSize: 16 }}>{displayedDeanScores.total.toFixed(1)}</div>
</div>
</div>
</div>

<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 20 }}>
 {[
 { label: "Employee ID", value: approval.employeeId },
 { label: "Submitted", value: approval.submittedOn },
 { label: "Self Part A", value: `${selfSummary.partA.toFixed(1)} / ${selfSummary.partAMax}` },
 { label: "Self Part B", value: `${selfSummary.partB.toFixed(1)} / ${selfSummary.partBMax}` },
 { label: "Self Part C", value: `${selfSummary.partC.toFixed(1)} / ${selfSummary.partCMax}` },
 { label: "Self Part D", value: `${selfSummary.partD.toFixed(1)} / ${selfSummary.partDMax}` },
 { label: "Self Total", value: `${selfSummary.total.toFixed(1)} / ${selfSummary.grandMax}` },
 { label: "Dean Total", value: displayedDeanScores.total.toFixed(1) },
 ].map((item) =>(
<div key={item.label} style={{ background: "#f8fafc", borderRadius: 12, padding: "18px 16px" }}>
<div style={{ fontSize: 10, color: "#64748b", fontWeight: 700, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.7 }}>{item.label}</div>
<div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>{item.value}</div>
</div>
 ))}
</div>
 {finalisedByVc && (
<div style={{ background: "#ecfdf5", border: "1px solid #86efac", color: "#065f46", borderRadius: 8, padding: "10px 12px", fontSize: 12, fontWeight: 700, marginBottom: 14 }}>
 This appraisal has been finalised by the VC.
</div>
 )}

<div style={{ display: "inline-flex", gap: 6, marginBottom: 16, padding: 4, background: "#f5f3ff", border: "1px solid #ddd6fe", borderRadius: 12, width: "fit-content", flexWrap: "wrap" }}>
 {[["partA", "Part A"], ["partB", "Part B"], ["partC", "Part C"], ["partD", "Part D"], ["summary", "Summary"]].map(([id, label]) =>(
<button key={id} onClick={() =>{
 setSectionView(id);
 requestAnimationFrame(() =>{
 window.scrollTo({ top: 0, left: 0, behavior: "auto" });
 });
 }}
 style={{ padding: "8px 18px", border: "none", borderRadius: 9, cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 800, background: sectionView === id ? "#4c1d95" : "transparent", color: sectionView === id ? "#ede9fe" : "#475569", boxShadow: sectionView === id ? "0 8px 18px rgba(76,29,149,0.22)" : "none" }}>
 {label}
</button>
 ))}
</div>

 {["partA", "partB", "partC", "partD"].includes(sectionView) && (
<fieldset disabled={reviewLocked} style={{ border: "none", padding: 0, margin: 0 }}>
<DeanReviewScoreForm approval={approval} deanData={deanData} setDeanData={setDeanData} sectionView={sectionView} />
</fieldset>
 )}
 {["partA", "partB", "partC", "partD"].includes(sectionView) && !reviewLocked && (
<div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 10, margin: "12px 0 14px", flexWrap: "wrap" }}>
<span style={{ color: "#64748b", fontSize: 11, fontWeight: 700 }}>{draftStatus}</span>
<button
 onClick={handleSaveDraft}
 disabled={savingDraft}
 style={{ padding: "10px 22px", background: savingDraft ? "#94a3b8" : "#2563eb", color: "#fff", border: "none", borderRadius: 7, cursor: savingDraft ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 13, fontFamily: "inherit" }}
>
 {savingDraft ? "Saving..." : "Save Draft"}
</button>
</div>
 )}

 {sectionView === "summary" && (
<>
<div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 14, display: "grid", gap: 10, boxShadow: "0 1px 6px rgba(0,0,0,.06)", marginBottom: 14 }}>
<CompactSummaryCard
 title="Faculty Score"
 subtitle="Faculty submitted score for the engineering appraisal form."
 totals={{ partA: selfSummary.partA, partB: selfSummary.partB, total: selfSummary.total }}
 maxScores={{ partA: selfSummary.partAMax, partB: selfSummary.partBMax, grand: selfSummary.grandMax }}
 accent="#0ea5e9"
/>
<SummaryOtherInfoField value={summaryOtherInfoValueFrom(approval)} readOnly rows={4} />
<CompactSummaryCard
 title="Dean Score"
 subtitle="Dean score for the engineering appraisal form."
 totals={displayedDeanScores}
 maxScores={reviewerMaxScores}
 accent="#4c1d95"
 remarksTitle="Dean Remarks"
 remarksContent={(
<textarea value={remarks} onChange={(e) =>setRemarks(e.target.value)} rows={4} readOnly={reviewLocked}
 style={{ width: "100%", border: "none", padding: 0, fontFamily: "inherit", fontSize: 12, color: "#334155", resize: "vertical", background: "transparent", outline: "none" }}
 />
 )}
/>
</div>
</>
 )}

 {sectionView === "summary" && (
<>
 {!reviewLocked && (
<label style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 14px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8, marginBottom: 14, color: "#334155", fontSize: 12, lineHeight: 1.5, cursor: "pointer" }}>
<input
 type="checkbox"
 checked={reviewConfirmed}
 onChange={(e) =>setReviewConfirmed(e.target.checked)}
 style={{ marginTop: 3 }}
 />
<span>I have verified all the details and confirm that the information provided is correct. I am responsible for the accuracy of this data.</span>
</label>
 )}

<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
<span style={{ color: "#64748b", fontSize: 11, fontWeight: 700 }}>{draftStatus}</span>
<div style={{ display: "flex", gap: 12, flex: 1, justifyContent: "flex-end", flexWrap: "wrap" }}>
<button onClick={onBack} style={{ flex: 1, padding: "12px 16px", borderRadius: 10, border: "1px solid #cbd5e1", background: "#f8fafc", color: "#475569", fontWeight: 700, cursor: "pointer" }}>{reviewLocked ? "Close" : "Cancel"}</button>
 {!reviewLocked && (
<>
<button
 onClick={handleSaveDraft}
 disabled={savingDraft}
 style={{ flex: 1, padding: "12px 16px", borderRadius: 10, border: "none", background: savingDraft ? "#94a3b8" : "#2563eb", color: "#f8fafc", fontWeight: 700, cursor: savingDraft ? "not-allowed" : "pointer" }}
>
 {savingDraft ? "Saving..." : "Save Draft"}
</button>
 {canReject && (
<button
 onClick={() =>{
 if (window.confirm("Reject this appraisal and send it back to the user for editing?")) {
 onSubmit(approval.id, deanScores, remarks, sectionScores, reviewConfirmed, "rejected");
 }
 }}
 disabled={!reviewConfirmed || !remarks.trim()}
 style={{ flex: 1, padding: "12px 16px", borderRadius: 10, border: "none", background: (reviewConfirmed && remarks.trim()) ? "#dc2626" : "#94a3b8", color: "#f8fafc", fontWeight: 700, cursor: (reviewConfirmed && remarks.trim()) ? "pointer" : "not-allowed" }}
>
 Reject Form
</button>
 )}
<button onClick={() =>onSubmit(approval.id, deanScores, remarks, sectionScores, reviewConfirmed)} disabled={!reviewConfirmed || !remarks.trim()} style={{ flex: 1, padding: "12px 16px", borderRadius: 10, border: "none", background: (reviewConfirmed && remarks.trim()) ? "#0f172a" : "#64748b", color: "#f8fafc", fontWeight: 700, cursor: (reviewConfirmed && remarks.trim()) ? "pointer" : "not-allowed" }}>Approve & Forward</button>
</>
 )}
</div>
</div>
</>
 )}
</div>
 );
}

// --- Main Dean Dashboard -------------------------------------------------------
export default function DeanDashboard() {
  const [activeMainTab, setActiveMainTab] = useState("schoolAppraisal");
  const [activeRoleTab, setActiveRoleTab] = useState("facultyApprovals");
  const [hodAppraisalTab, setHodAppraisalTab] = useState("partA");
  const [reviewingApproval, setReviewingApproval] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(null);

  const [facultyList, setFacultyList] = useState([]);
  const [hodList, setHodList] = useState([]);
  const [directorList, setDirectorList] = useState([]);

  const userProfile = profileFromsessionStorage();
  const activeDeanTrack = getDeanTrack(userProfile);
  const activeSchools = getSchoolsByDeanTrack(activeDeanTrack);
  const activeSchoolCodes = activeSchools.map((s) => s.code);

  useEffect(() => {
    const loadReviewQueue = async () => {
      try {
        const items = await fetchReviewQueueForRole({
          reviewerRole: "dean",
          reviewerProfile: userProfile,
          schoolValues: activeSchoolCodes,
        });
        const schoolOf = (item) => getSchoolKey(item.school || item.school_name || item.schoolName || "");
        const roleOf = (item) => (item.appraisalRole || item.appraisal_role || "").toLowerCase();
        const scopedItems = items.filter((item) => {
          const code = schoolOf(item);
          return activeSchoolCodes.includes(code) || activeSchoolCodes.includes(item.school);
        });
        setFacultyList(scopedItems.filter((item) => roleOf(item) === "faculty"));
        setHodList(scopedItems.filter((item) => roleOf(item) === "hod" && (schoolOf(item) === "SoEMR" || item.school === "SoEMR")));
        setDirectorList(scopedItems.filter((item) => roleOf(item) === "director"));
      } catch (err) {
        console.error("Could not load Dean review queue:", err);
        setFacultyList([]);
        setHodList([]);
        setDirectorList([]);
      }
    };

    loadReviewQueue();
  }, [activeSchoolCodes.join(",")]);

  const [filterStatus, setFilterStatus] = useState("All");
  const [selectedSchoolCode, setSelectedSchoolCode] = useState(activeSchools[0]?.code || "SoCSEA");
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const isDeanPending = (item) => {
    const s = item.status || "";
    if (isPendingReviewStatusFor([s, item.workflowStatus, item.workflow_status], "dean")) return true;
    return s === "pending_dean" ||
      (n(item.deanTotal) <= 0 && !String(item.deanRemarks || "").trim() && s !== "Reviewed" && s !== "pending_vc" && s !== "completed" && !/Dean\s*(Reviewed|Rejected)/i.test(s));
  };
  const isDeanReviewed = (item) => {
    const s = item.status || "";
    if (isPendingReviewStatusFor([s, item.workflowStatus, item.workflow_status], "dean")) return false;
    return n(item.deanTotal) > 0 || String(item.deanRemarks || "").trim() !== "" || s === "Reviewed" || s === "pending_vc" || s === "completed" || /Dean\s*Reviewed/i.test(s);
  };

  const facultyPendingCount = facultyList.filter(isDeanPending).length;
  const hodPendingCount = hodList.filter(isDeanPending).length;
  const directorPendingCount = directorList.filter(isDeanPending).length;
  const totalSchoolPendingCount = facultyPendingCount + hodPendingCount + directorPendingCount;

  const activeApprovalList = activeRoleTab === "hodApprovals"
    ? hodList
    : activeRoleTab === "directorApprovals"
    ? directorList
    : facultyList;

  const activeSchoolApprovalList = (selectedSchoolCode === "all" || selectedSchoolCode === "DEAN-ENGG" || selectedSchoolCode === "DEAN-NONENGG")
    ? activeApprovalList
    : activeApprovalList.filter((item) => getSchoolKey(item.school) === selectedSchoolCode || item.school === selectedSchoolCode);

  const pendingCount = activeSchoolApprovalList.filter(isDeanPending).length;
  const reviewedCount = activeSchoolApprovalList.filter(isDeanReviewed).length;

  const filtered = filterStatus === "All"
    ? activeSchoolApprovalList
    : (filterStatus === "Pending Review"
    ? activeSchoolApprovalList.filter(isDeanPending)
    : activeSchoolApprovalList.filter(isDeanReviewed));

  const schoolCards = activeSchools.map((school) => {
    const visual = SCHOOL_VISUALS[school.code] || {};
    return {
      code: school.code,
      icon: visual.icon || school.code.slice(2).toUpperCase(),
      name: school.name,
      shortName: school.shortName || school.name.replace(/^School of\s+/i, ""),
    };
  });

  const activeSchoolInfo = schoolCards.find((s) => s.code === selectedSchoolCode) || schoolCards[0];
  const activeSchoolMembersCount = (selectedSchoolCode === "all" || selectedSchoolCode === "DEAN-ENGG")
    ? activeApprovalList.length
    : activeApprovalList.filter((item) => getSchoolKey(item.school) === selectedSchoolCode || item.school === selectedSchoolCode).length;

  const roleTabsForSchool = [
    {
      id: "facultyApprovals",
      label: "Faculty's Appraisal",
      count: facultyList.filter((item) => (selectedSchoolCode === "all" || selectedSchoolCode === "DEAN-ENGG") ? true : (getSchoolKey(item.school) === selectedSchoolCode || item.school === selectedSchoolCode)).filter(isDeanPending).length,
    },
    ...(selectedSchoolCode === "SoEMR" || selectedSchoolCode === "DEAN-ENGG" || selectedSchoolCode === "all" || hodList.some((item) => getSchoolKey(item.school) === selectedSchoolCode || item.school === selectedSchoolCode)
      ? [{
          id: "hodApprovals",
          label: "HOD's Appraisal",
          count: hodList.filter((item) => (selectedSchoolCode === "all" || selectedSchoolCode === "DEAN-ENGG") ? true : (getSchoolKey(item.school) === selectedSchoolCode || item.school === selectedSchoolCode)).filter(isDeanPending).length,
        }]
      : []),
    {
      id: "directorApprovals",
      label: "Director's Appraisal",
      count: directorList.filter((item) => (selectedSchoolCode === "all" || selectedSchoolCode === "DEAN-ENGG") ? true : (getSchoolKey(item.school) === selectedSchoolCode || item.school === selectedSchoolCode)).filter(isDeanPending).length,
    },
  ];

  const navItems = [
    { id: "myAppraisal", icon: "", label: "My Appraisal", sub: "View your self-appraisal form" },
    { id: "schoolAppraisal", icon: "", label: "School Appraisal", sub: "Review school submissions", badge: totalSchoolPendingCount },
  ];

  const handleSubmitReview = async (id, scores, remarks, sectionScores, reviewConfirmed = false, decision = "approved") => {
    if (!reviewConfirmed) {
      alert("Please verify and confirm the accuracy declaration before submitting the review.");
      return;
    }
    if (!remarks?.trim()) {
      alert("Remarks are mandatory. Please enter your remarks before submitting the review.");
      return;
    }
    const sourceList = activeRoleTab === "facultyApprovals"
      ? facultyList
      : activeRoleTab === "hodApprovals"
      ? hodList
      : directorList;
    const item = sourceList.find((entry) => entry.id === id);
    if (!item) return;

    try {
      await submitWorkflowReview({
        subjectEmail: item.email,
        academicYear: item.academicYear || item.academic_year || item.info?.ay || APP_INFO.DEFAULT_AY || "2026-2027",
        reviewerRole: "dean",
        partAScore: scores.partA,
        partBScore: scores.partB,
        partCScore: scores.partC,
        partDScore: scores.partD,
        totalScore: scores.total,
        remarks,
        sectionScores,
        subjectProfile: item,
        decision,
      });

      const status = decision === "rejected" ? rejectedStatusFor("dean") : reviewedStatusFor("dean");
      const markReviewed = (entry) => entry.id === id
        ? { ...entry, ...sectionScores, innovDean: sectionScores?.innovativeTeaching?.dean ?? entry.innovDean, status, workflowStatus: status, deanPartA: scores.partA, deanPartB: scores.partB, deanTotal: scores.total, deanRemarks: remarks }
        : entry;

      if (activeRoleTab === "facultyApprovals") {
        setFacultyList((prev) => prev.map(markReviewed));
      }
      if (activeRoleTab === "hodApprovals") {
        setHodList((prev) => prev.map(markReviewed));
      }
      if (activeRoleTab === "directorApprovals") {
        setDirectorList((prev) => prev.map(markReviewed));
      }
      setReviewingApproval(null);
      alert(decision === "rejected" ? "Appraisal rejected and sent back for editing." : "Dean review approved and forwarded to VC.");
    } catch (err) {
      console.error("Could not submit Dean review:", err);
      alert(`Unable to submit Dean review.\n\n${err.message}`);
    }
  };

  const handleMyAppraisalSectionChange = (section) => {
    setHodAppraisalTab(section);
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });
  };

  return (
    <DashboardLayout
      appInfo={APP_INFO}
      showLogoutModal={showLogoutModal}
      onCancelLogout={() => setShowLogoutModal(false)}
      containerStyle={{ display: "flex", minHeight: "100vh", fontFamily: "inherit", background: "#f4f6fa", color: "#1e293b" }}
      mainStyle={{ flex: 1, padding: "24px 30px", display: "flex", flexDirection: "column", gap: 18, overflowX: "auto" }}
      sidebar={(
        <DashboardSidebar
          appInfo={APP_INFO}
          navItems={navItems}
          activeTab={activeMainTab}
          onTabSelect={(tab) => { setActiveMainTab(tab); setReviewingApproval(null); }}
          showSectionSelector={activeMainTab === "myAppraisal"}
          sectionTab={hodAppraisalTab}
          onSectionChange={handleMyAppraisalSectionChange}
          afterNav={(
            <div style={{ background: "#1e293b", borderRadius: 9, padding: "12px 13px", display: "grid", gap: 8 }}>
              <div style={{ fontSize: 9, color: "#94a3b8", fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.9 }}>Schools Overseen</div>
              {ENGINEERING_SCHOOLS.map((school) => {
                const visual = SCHOOL_VISUALS[school.code] || {};
                return (
                  <div key={school.code} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 10, color: "#cbd5e1" }}>
                    <span style={{ width: 9, height: 9, borderRadius: 2, background: visual.color || "#64748b", display: "inline-block" }} />
                    <span style={{ color: visual.color || "#cbd5e1", fontWeight: 800 }}>{visual.icon || "-"}</span>
                    <span>{school.code}</span>
                  </div>
                );
              })}
            </div>
          )}
          profileSubtitle={`Dean - ${sessionStorage.getItem("department")?.split(" ")[0] || ""}`}
          onLogout={() => setShowLogoutModal(true)}
          showLogoutSpacer
        />
      )}
    >
      {activeMainTab === "myAppraisal" && (
        <MyAppraisalSection
          sectionTab={hodAppraisalTab}
          onSectionTabChange={handleMyAppraisalSectionChange}
          defaultDesignation={sessionStorage.getItem("role") === "dean" ? "Dean" : ""}
          defaultAcademicYear={sessionStorage.getItem("academicYear") || APP_INFO.DEFAULT_AY}
          titleNameFallback="Dean"
          subtitleSeparator=" - "
        />
      )}

      {(activeMainTab === "schoolAppraisal" || activeMainTab === "hodApprovals" || activeMainTab === "directorApprovals" || activeMainTab === "facultyApprovals") && !reviewingApproval && (
        <>
          {/* Horizontal School Selector Bar */}
          <div style={{ background: "#ffffff", borderRadius: 14, border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden", display: "grid", gridTemplateColumns: `repeat(${schoolCards.length}, 1fr)` }}>
            {schoolCards.map((school) => {
              const active = selectedSchoolCode === school.code;
              return (
                <button
                  key={school.code}
                  onClick={() => setSelectedSchoolCode(school.code)}
                  style={{
                    padding: "16px 12px",
                    border: "none",
                    borderBottom: active ? "3px solid #6366f1" : "3px solid transparent",
                    background: active ? "#f5f3ff" : "#ffffff",
                    cursor: "pointer",
                    textAlign: "center",
                    fontFamily: "inherit",
                    transition: "all 0.2s ease",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                  }}
                >
                  <span style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: active ? "#6366f1" : "#f1f5f9",
                    color: active ? "#ffffff" : "#475569",
                    fontWeight: 800,
                    fontSize: 13,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 4,
                    boxShadow: active ? "0 4px 10px rgba(99,102,241,0.25)" : "none",
                  }}>
                    {school.icon}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: active ? "#4338ca" : "#1e293b" }}>
                    {school.code}
                  </span>
                  <span style={{ fontSize: 11, color: active ? "#6366f1" : "#64748b", fontWeight: 600, lineHeight: 1.25, maxWidth: 160, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {school.shortName}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Role Sub-Tabs & Filter Bar directly below Horizontal School Selector */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#ffffff", padding: "10px 16px", borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.03)", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {roleTabsForSchool.map((role) => {
                const active = activeRoleTab === role.id;
                return (
                  <button
                    key={role.id}
                    onClick={() => setActiveRoleTab(role.id)}
                    style={{
                      padding: "8px 18px",
                      borderRadius: 8,
                      border: "none",
                      background: active ? "#4338ca" : "transparent",
                      color: active ? "#ffffff" : "#475569",
                      fontWeight: 800,
                      fontSize: 13,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      fontFamily: "inherit",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span>{role.label}</span>
                    {role.count > 0 && (
                      <span style={{
                        background: active ? "rgba(255,255,255,0.25)" : "#e0e7ff",
                        color: active ? "#ffffff" : "#4338ca",
                        padding: "2px 8px",
                        borderRadius: 12,
                        fontSize: 11,
                        fontWeight: 800,
                      }}>
                        {role.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>Filter:</span>
              {[
                ["All", "All"],
                ["Pending Review", "Pending Review"],
                ["Reviewed", "Dean Reviewed"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setFilterStatus(value)}
                  style={{
                    fontSize: 11,
                    padding: "5px 14px",
                    border: filterStatus === value ? "none" : "1px solid #e2e8f0",
                    borderRadius: 20,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    fontWeight: 700,
                    background: filterStatus === value ? "#4338ca" : "#ffffff",
                    color: filterStatus === value ? "#ffffff" : "#475569",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Submissions Grid or Empty State */}
          {filtered.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14 }}>
              {filtered.map((faculty) => {
                const facultySummary = standardSubmittedScoreSummary(faculty);
                const courseFilePartA = Array.isArray(faculty.courseFile)
                  ? (() => {
                      const filled = faculty.courseFile.filter((row) => String(row?.score ?? "").trim() !== "");
                      return filled.length ? filled.reduce((total, row) => total + courseFileRowScore(row), 0) / filled.length : 0;
                    })()
                  : n(faculty.courseFile?.score);
                const docCount = Object.values(faculty.docs || {}).reduce((a, arr) => a + arr.length, 0);

                return (
                  <div key={faculty.id} style={{ background: "#fff", borderRadius: 12, padding: "18px 20px", boxShadow: "0 1px 6px rgba(0,0,0,.07)", display: "flex", flexDirection: "column", gap: 14, border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                      <Avatar initials={faculty.avatar} color={faculty.avatarColor} size={46} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 2 }}>{faculty.name}</div>
                        <div style={{ fontSize: 11, color: "#475569", marginBottom: 2 }}>{faculty.designation}</div>
                        <div style={{ fontSize: 10, color: "#94a3b8", fontFamily: "monospace" }}>{faculty.employeeId}</div>
                      </div>
                      <StatusBadge status={faculty.status} />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8, background: "#f8fafc", borderRadius: 8, padding: "12px 10px" }}>
                      {[
                        { label: "Part A", val: facultySummary.partA, max: facultySummary.partAMax, color: "#6366f1" },
                        { label: "Part B", val: facultySummary.partB, max: facultySummary.partBMax, color: "#0ea5e9" },
                        { label: "Part C", val: facultySummary.partC, max: facultySummary.partCMax, color: "#10b981" },
                        { label: "Part D", val: facultySummary.partD, max: facultySummary.partDMax, color: "#f59e0b" },
                        { label: "Total", val: facultySummary.total, max: facultySummary.grandMax, color: "#4338ca" },
                      ].map(({ label, val, max, color }) => (
                        <div key={label} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <div style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
                          <div style={{ fontSize: 13, fontWeight: 800, color, lineHeight: 1 }}>
                            {val.toFixed ? val.toFixed(1) : val}{max != null && <span style={{ fontSize: 8, color: "#94a3b8" }}>/{max}</span>}
                          </div>
                          {max != null && max > 0 && <ScoreBar score={val} max={max} color={color} />}
                        </div>
                      ))}
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f1f5f9", paddingTop: 12 }}>
                      <div style={{ fontSize: 10, color: "#94a3b8" }}>Submitted: {faculty.submittedOn}</div>
                      <button
                        disabled={reviewLoading === faculty.id}
                        onClick={async () => {
                          setReviewLoading(faculty.id);
                          try {
                            const data = await fetchSavedAppraisal({
                              facultyEmail: faculty.email,
                              academicYear: faculty.academic_year || faculty.academicYear || APP_INFO.DEFAULT_AY || "2026-2027",
                            });
                            const form = data?.payload?.form || data?.form || {};
                            const docs = data?.payload?.docs || data?.docs || {};
                            const mergedForm = preserveSavedReviewScores(form, faculty);
                            const declaration = data?.declaration || faculty.declaration || null;
                            setReviewingApproval({ ...faculty, ...mergedForm, docs, declaration, status: declaration?.status || data?.status || faculty.status, workflowStatus: declaration?.status || data?.workflowStatus || faculty.workflowStatus });
                          } catch (err) {
                            alert(`Unable to open submitted form.\n\n${err.message}`);
                          } finally {
                            setReviewLoading(null);
                          }
                        }}
                        style={{ fontSize: 11, padding: "7px 18px", background: isDeanReviewed(faculty) ? "#1e293b" : "#312e81", color: "#f1f5f9", border: "none", borderRadius: 6, cursor: reviewLoading === faculty.id ? "wait" : "pointer", fontWeight: 700, fontFamily: "inherit", opacity: reviewLoading === faculty.id ? 0.7 : 1 }}
                      >
                        {reviewLoading === faculty.id ? "Loading..." : isDeanReviewed(faculty) ? "View Review" : "Review Form"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ background: "#ffffff", borderRadius: 14, padding: "64px 24px", border: "1.5px dashed #cbd5e1", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ background: "#f5f3ff", border: "1.5px dashed #c7d2fe", color: "#6366f1", padding: "8px 20px", borderRadius: 12, fontWeight: 800, fontSize: 15, marginBottom: 16, display: "inline-block" }}>
                {activeSchoolInfo.code}
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#1e293b", marginBottom: 6 }}>
                No submissions yet
              </div>
              <div style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>
                New appraisal forms will appear here automatically.
              </div>
            </div>
          )}
        </>
      )}

      {/* REVIEW PANEL */}
      {(activeMainTab === "schoolAppraisal" || activeMainTab === "hodApprovals" || activeMainTab === "directorApprovals" || activeMainTab === "facultyApprovals") && reviewingApproval && (
        <ApprovalReviewPanel
          approval={reviewingApproval}
          approvalType={activeRoleTab}
          onBack={() => setReviewingApproval(null)}
          onSubmit={handleSubmitReview}
          readOnly={isDeanReviewed(reviewingApproval)}
        />
      )}
    </DashboardLayout>
  );
}








