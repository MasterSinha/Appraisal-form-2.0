/* eslint-disable no-unused-vars */
import { useState, useRef, useEffect } from "react";
import MyAppraisalForm from "../components/appraisal";
import { Avatar, ScoreCard, ScoreBar, StatusBadge, ReviewMetricsStrip, uploadedDocCount } from "../components/dashboard/dashboardPrimitives";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import { api } from "../services/api";
import { ACR_DETAIL_POINTS, APP_INFO, createAcrRows, fetchSavedAppraisal, loadAppraisalDocuments, loadSavedAppraisal, mergeFacultyInfo, saveAppraisalDraftSection, submitAppraisal, fetchReviewQueueForRole, loadReviewerDraft, saveReviewerDraft, submitWorkflowReview, INNOVATIVE_METHODS, SCORE_LIMITS, averageSectionScore, clampScore, clampReviewScore, courseFileAverageScore, courseFileRowScore, effectiveMaxScore, feedbackAverage, feedbackRowScore, feedbackSectionScore, innovativeSelectionsFromDetails, innovativeTeachingScore, isAllowedAttachmentFile, isValidDDMMYYYY, maskDateDDMMYYYY, normalizeAutoScores, projectGuidanceRowMax, researchGuidanceRowMax, researchGuidanceScore, reviewSectionScore, rowHasReviewableData, scoreRemaining, selfEffectivePartAMax, societyRowLocked, societyRowScore, sumSectionScore, toggleInnovativeMethod, validateCompleteRows, standardSubmittedScoreSummary, AppraisalHeaderImage, SummaryOtherInfoField, summaryOtherInfoValueFrom, RejectionNotice, DocCell, ViewCell, ViewDocsCell, RowButtons as RowBtns, SectionSaveFooter, SectionCard as SC, T, TH, TH_HOD, TD, TDC, TDS, TDS_HOD, TDV, MyAppraisalSection, CreativeSchoolAuthorityReviewPanel, isCreativeSchool, isDesignArtsSchool, isMediaCommSchool } from "../features/faculty-appraisal";
import { getActiveAcademicYear, getSessionItem, normalizeAcademicYearLabel, setActiveAcademicYear } from "../auth/session";
import { PreviousYearReportViewer } from "../features/previousYearReport";
import { isLegacyTwoPartAcademicYear } from "../features/faculty-appraisal/forms/standard/legacyPreviousYearReportUtils";
import { canReviewerRejectProfile, rejectedStatusFor, reviewedStatusFor, profileFromsessionStorage, workflowValidationError, roleLabel, isAppraisalFinalisedByVc, isRejectedStatus, isPendingReviewStatusFor, hasActiveRejection, reviewListFrom } from "../utils/hierarchy";
import { n, pct, grade, reportValue, reportTextValue, reportQualification, reportExperience, RO, TI } from "../features/faculty-appraisal/shared";

// - Helpers - (n, pct, grade, reportValue, reportTextValue, reportQualification, reportExperience, RO, TI → imported from shared)

const REVIEW_ARRAY_KEYS = ["lectures", "courseFile", "obeRows", "projects", "mentoringRows", "quals", "feedback", "deptActs", "uniActs", "eventRows", "society", "industry", "alumniRows", "placementRows", "acr", "journals", "books", "ict", "research", "projects2", "patents", "awards", "confs", "proposals", "products", "fdps"];
const REVIEW_SECTION_MAX = { lectures: 40, courseFile: 20, obeRows: 20, projects: 20, mentoringRows: 10, quals: 10, feedback: 10, deptActs: 30, uniActs: 50, eventRows: 20, society: 20, industry: 8, alumniRows: 10, placementRows: 20, acr: 50, journals: 100, books: 30, ict: 20, research: 20, projects2: 40, patents: 40, awards: 20, confs: 20, proposals: 20, products: 20, fdps: 20 };
const REVIEW_SCORE_FIELDS = ["hod", "director", "dean", "vc"];
const storedAcademicYearCycles = () => {
 try {
 if (getSessionItem("availableCyclesSource") !== "backend") return [];
 return JSON.parse(getSessionItem("availableCycles") || "[]")
 .map((cycle) => {
 const academicYear = normalizeAcademicYearLabel(cycle?.academic_year || cycle?.academicYear || cycle?.year || cycle?.year_label || cycle);
 return academicYear ? { academic_year: academicYear, is_open: cycle?.is_open ?? cycle?.isOpen ?? cycle?.active ?? cycle?.open ?? academicYear === APP_INFO.DEFAULT_AY } : null;
 })
 .filter(Boolean);
 } catch {
 return [];
 }
};
const previousYearFormTypeFor = (profile = {}) => {
 if (isMediaCommSchool(profile, profile.info?.school, profile.school)) return "mediaCommunication";
 if (isDesignArtsSchool(profile, profile.info?.school, profile.school)) return "designArts";
 return "engineering";
};
function PreviousYearAuthorityResult({ item, onBack }) {
 return (
 <div style={{ display: "grid", gap: 12 }}>
 <button type="button" onClick={onBack} style={{ justifySelf: "start", border: "1px solid #cbd5e1", background: "#fff", color: "#334155", borderRadius: 8, padding: "8px 14px", fontWeight: 800, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Back</button>
 <PreviousYearReportViewer showTables visibleLevels={["faculty", "hod"]} formType={previousYearFormTypeFor(item)} form={item} docs={item.docs || {}} response={item.previousYearResponse || item} academicYear={item.academicYear || item.academic_year || item.info?.ay} profile={item} reviews={reviewListFrom(item.reviews || item.previousYearResponse?.reviews || item.previousYearResponse?.payload?.reviews)} />
 </div>
 );
}
const preserveSavedReviewScores = (form = {}, source = {}) =>{
 const merged = { ...form };
 merged.info = mergeFacultyInfo(form.info, source, form);
 REVIEW_ARRAY_KEYS.forEach((key) =>{
 if (!Array.isArray(form[key])) return;
 const sourceRows = Array.isArray(source[key]) ? source[key] : [];
 merged[key] = form[key].map((row, index) =>{
 const sourceRow = sourceRows[index] || {};
 const next = { ...row };
 REVIEW_SCORE_FIELDS.forEach((field) =>{
 if (String(next[field] ?? "").trim() === "" && String(sourceRow[field] ?? "").trim() !== "") {
 next[field] = sourceRow[field];
 }
 });
 return next;
 });
 });
 ["innovHod", "innovDirector", "innovDean", "innovVc"].forEach((field) =>{
 if (String(merged[field] ?? "").trim() === "" && String(source[field] ?? "").trim() !== "") {
 merged[field] = source[field];
 }
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
const buildHodSectionScores = (faculty, hodData) =>{
 const payload = {};
 REVIEW_ARRAY_KEYS.forEach((key) =>{
 const rows = key === "acr" ? createAcrRows(faculty[key]) : (Array.isArray(faculty[key]) ? faculty[key] : []);
 payload[key] = rows.map((row, index) =>({
 ...row,
 hod: key === "society" && societyRowLocked(row)
 ? "0"
 : clampReviewScore(key, row, hodData[key]?.[index]?.hod ?? row.hod ?? "", REVIEW_SECTION_MAX[key] || 0),
 }));
 });
 const innovRows = Array.isArray(faculty.innovRows) ? faculty.innovRows : [];
 const reviewInnovRows = Array.isArray(hodData.innovRows) ? hodData.innovRows : [];
 const mergedInnovRows = innovRows.map((row, index) =>({
 ...row,
 hod: clampReviewScore("innovRows", row, reviewInnovRows[index]?.hod ?? row.hod ?? "", 10),
 }));
 const innovTotal = reviewSectionScore("innovRows", mergedInnovRows, 10, "hod");
 payload.innovRows = mergedInnovRows;
 payload.innovativeTeaching = {
 hod: innovTotal ? String(innovTotal) : hodData.innovHod ?? faculty.innovHod ?? "",
 };
 return payload;
};

// - Full Review Panel (opened when HOD clicks Review) -
function ReviewPanel({ faculty, onBack, onSubmit, readOnly = false, reviewerLabel = "HOD", reviewerRole = "hod" }) {
  if (isCreativeSchool(faculty)) {
    return (
      <CreativeSchoolAuthorityReviewPanel
        person={faculty}
        reviewerRole={reviewerRole}
        onBack={onBack}
        onSubmit={onSubmit}
        readOnly={readOnly}
        showReport={true}
      />
    );
  }
  return (
    <StandardReviewPanel
      faculty={faculty}
      onBack={onBack}
      onSubmit={onSubmit}
      readOnly={readOnly}
      reviewerLabel={reviewerLabel}
      reviewerRole={reviewerRole}
    />
  );
}

function StandardReviewPanel({ faculty, onBack, onSubmit, readOnly = false, reviewerLabel = "HOD", reviewerRole = "hod" }) {
  const [hodData, setHodData] = useState({});
  const [remarks, setRemarks] = useState(faculty.hodRemarks || "");
  const [sectionView, setSectionView] = useState("partA");
 const [reviewConfirmed, setReviewConfirmed] = useState(false);
 const [draftStatus, setDraftStatus] = useState("");
 const [savingDraft, setSavingDraft] = useState(false);
 const finalisedByVc = isAppraisalFinalisedByVc(faculty);
 const pendingThisReviewer = isPendingReviewStatusFor([faculty.status, faculty.workflowStatus, faculty.workflow_status], reviewerRole);
 const reviewLocked = finalisedByVc || readOnly || (!pendingThisReviewer && (faculty.status === "Reviewed" || /(?:HOD|Center Head)\s*(Reviewed|Rejected)/i.test(faculty.status || "") || n(faculty.hodTotal) >0 || String(faculty.hodRemarks || "").trim() !== ""));
 const canReject = canReviewerRejectProfile(reviewerRole, faculty);
 const subjectEmail = faculty.email || faculty.faculty_email || faculty.facultyEmail;
 const academicYear = faculty.academicYear || faculty.academic_year || faculty.info?.ay || APP_INFO.DEFAULT_AY || "2026-2027";
 const reviewerMaxScores = {
 partA: effectiveMaxScore(150),
 partB: effectiveMaxScore(350),
 partC: 150,
 partD: 50,
 grand: 0,
 };
 reviewerMaxScores.grand = reviewerMaxScores.partA + reviewerMaxScores.partB + reviewerMaxScores.partC + reviewerMaxScores.partD;

 // Compute HOD total from hodData
 const calcHodScore = () =>{
 const get = (section, idx, field) =>{
 if (hodData[section]) {
 const s = hodData[section];
 return idx === null ? n(Array.isArray(s) ? s[0]?.[field] : s[field]) : n(s[idx]?.[field]);
 }
 const source = faculty[section];
 return idx === null ? n(Array.isArray(source) ? source[0]?.[field] : source?.[field]) : n(source?.[idx]?.[field]);
 };
 const getS = (key) =>n(hodData[key] ?? faculty[key]);
 const sumReviewRows = (section, field, max, rowMax) =>clampScore(
 (section === "acr" ? createAcrRows(faculty[section]) : (faculty[section] || [])).reduce((total, row, index) =>{
 if (section === "society" && societyRowLocked(row)) return total;
 if (!rowHasReviewableData(section, row)) return total;
 const limit = typeof rowMax === "function" ? rowMax(row) : rowMax;
 return total + (limit ? clampScore(get(section, index, field), limit) : get(section, index, field));
 }, 0),
 max,
 );
 const innovReviewRows = (faculty.innovRows || []).map((row, index) =>({
 ...row,
 hod: hodData.innovRows?.[index]?.hod ?? row.hod ?? "",
 }));
 const lectureReviewRows = (faculty.lectures || []).map((row, index) =>({
 ...row,
 hod: hodData.lectures?.[index]?.hod ?? row.hod ?? "",
 }));
 const courseFileReviewRows = (faculty.courseFile || []).map((row, index) =>({
 ...row,
 hod: hodData.courseFile?.[index]?.hod ?? row.hod ?? "",
 }));
 const feedbackReviewRows = (faculty.feedback || []).map((row, index) =>({
 ...row,
 hod: hodData.feedback?.[index]?.hod ?? row.hod ?? "",
 }));

 const lec = reviewSectionScore("lectures", lectureReviewRows, 40, "hod");
 const cf = reviewSectionScore("courseFile", courseFileReviewRows, 20, "hod");
 const innov = innovReviewRows.length ? reviewSectionScore("innovRows", innovReviewRows, 10, "hod") : clampScore(getS("innovHod"), 10);
 const obe = sumReviewRows("obeRows", "hod", 20, (row) =>row.max || 20);
 const proj = sumReviewRows("projects", "hod", 20, projectGuidanceRowMax);
 const mentoring = sumReviewRows("mentoringRows", "hod", 10, (row) =>row.max || 10);
 const qual = sumReviewRows("quals", "hod", 10, SCORE_LIMITS.qualificationRow);
 const fb = reviewSectionScore("feedback", feedbackReviewRows, 10, "hod");
 const partA = clampScore(lec + cf + innov + fb + obe + proj + mentoring + qual, reviewerMaxScores.partA);

 const jour = sumReviewRows("journals", "hod", 100);
 const bk = sumReviewRows("books", "hod", 30);
 const ictT = sumReviewRows("ict", "hod", 20);
 const res = sumReviewRows("research", "hod", 20, researchGuidanceRowMax);
 const resProjects = sumReviewRows("projects2", "hod", 40);
 const pat = sumReviewRows("patents", "hod", 40);
 const awd = sumReviewRows("awards", "hod", 20);
 const conf = sumReviewRows("confs", "hod", 20);
 const prop = sumReviewRows("proposals", "hod", 20);
 const prod = sumReviewRows("products", "hod", 20);
 const b8 = sumReviewRows("fdps", "hod", 20, SCORE_LIMITS.fdpRow);
 const partB = clampScore(jour + bk + pat + resProjects + res + prop + conf + b8 + awd + prod + ictT, reviewerMaxScores.partB);

 const uni = sumReviewRows("uniActs", "hod", 50);
 const dept = sumReviewRows("deptActs", "hod", 30);
 const events = sumReviewRows("eventRows", "hod", 20);
 const soc = sumReviewRows("society", "hod", 20, SCORE_LIMITS.societyRow);
 const ind = sumReviewRows("industry", "hod", 8);
 const alumni = sumReviewRows("alumniRows", "hod", 10);
 const placement = sumReviewRows("placementRows", "hod", 20);
 const partC = clampScore(uni + dept + events + soc + ind + alumni + placement, reviewerMaxScores.partC);
 const partD = clampScore(sumReviewRows("acr", "hod", 50, SCORE_LIMITS.acrRow), reviewerMaxScores.partD);

 return { partA, partB, partC, partD, total: clampScore(partA + partB + partC + partD, reviewerMaxScores.grand) };
 };

 const calculatedScores = calcHodScore();
 const hasSavedReviewerScores = ["hodPartA", "hodPartB", "hodPartC", "hodPartD", "hodTotal"].some((key) =>String(faculty?.[key] ?? "").trim() !== "");
 const rawDisplayedScores = reviewLocked && hasSavedReviewerScores ? {
 partA: String(faculty?.hodPartA ?? "").trim() !== "" ? n(faculty.hodPartA) : calculatedScores.partA,
 partB: String(faculty?.hodPartB ?? "").trim() !== "" ? n(faculty.hodPartB) : calculatedScores.partB,
 partC: String(faculty?.hodPartC ?? "").trim() !== "" ? n(faculty.hodPartC) : calculatedScores.partC,
 partD: String(faculty?.hodPartD ?? "").trim() !== "" ? n(faculty.hodPartD) : calculatedScores.partD,
 total: String(faculty?.hodTotal ?? "").trim() !== "" ? n(faculty.hodTotal) : calculatedScores.total,
 } : calculatedScores;
 const displayedScores = {
 partA: clampScore(rawDisplayedScores.partA, reviewerMaxScores.partA),
 partB: clampScore(rawDisplayedScores.partB, reviewerMaxScores.partB),
 partC: clampScore(rawDisplayedScores.partC, reviewerMaxScores.partC),
 partD: clampScore(rawDisplayedScores.partD, reviewerMaxScores.partD),
 total: clampScore(rawDisplayedScores.total || rawDisplayedScores.partA + rawDisplayedScores.partB + rawDisplayedScores.partC + rawDisplayedScores.partD, reviewerMaxScores.grand),
 };
 const { partA, partB, partC, partD, total } = displayedScores;
 const g = grade(total, reviewerMaxScores.grand);
 useEffect(() =>{
 let active = true;
 if (reviewLocked || !subjectEmail) return undefined;
 loadReviewerDraft({ subjectEmail, academicYear, reviewerRole })
 .then((draft) =>{
 if (!active || !draft?.payload) return;
 setHodData(draft.payload.section_scores || {});
 setRemarks(draft.payload.remarks ?? "");
 setDraftStatus(draft.updated_at ? `Last saved: ${new Date(draft.updated_at).toLocaleString()}` : "Draft loaded");
 })
 .catch((err) =>{
 if (!active) return;
 console.error("Could not load reviewer draft:", err);
 setDraftStatus(err?.message || "Could not load draft.");
 });
 return () =>{ active = false; };
 }, [academicYear, reviewLocked, reviewerRole, subjectEmail]);

 const handleSaveDraft = async () =>{
 try {
 setSavingDraft(true);
 await saveReviewerDraft({
 subjectEmail,
 academicYear,
 reviewerRole,
 partAScore: partA,
 partBScore: partB,
 partCScore: partC,
 partDScore: partD,
 totalScore: total,
 remarks,
 sectionScores: buildHodSectionScores(faculty, hodData),
 });
 setDraftStatus(`Draft saved: ${new Date().toLocaleString()}`);
 } catch (err) {
 console.error("Could not save reviewer draft:", err);
 setDraftStatus(err?.message || "Unable to save draft.");
 } finally {
 setSavingDraft(false);
 }
 };

  const handleSaveAndNext = async () => {
    await handleSaveDraft();
    const NEXT_SECTION_MAP = { partA: "partB", partB: "partC", partC: "partD", partD: "summary" };
    const nextSection = NEXT_SECTION_MAP[sectionView];
    if (nextSection) {
      setSectionView(nextSection);
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
      });
    }
  };
 const facultySummary = standardSubmittedScoreSummary(faculty, {
 partA: faculty.lectures?.reduce((a, r) =>a + n(r.score), 0) || 0,
 partB: faculty.journals?.reduce((a, r) =>a + n(r.score), 0) || 0,
 });

 return (
<div style={{ display: "flex", flexDirection: "column", gap: 0, minHeight: "100%" }}>
 {/* Header */}
<div style={{ background: "linear-gradient(135deg,#0f172a 0%,#111827 58%,#1e1b4b 100%)", padding: "16px 18px", display: "flex", alignItems: "center", gap: 14, marginBottom: 16, borderRadius: 14, boxShadow: "0 18px 42px rgba(15,23,42,0.20)", border: "1px solid rgba(255,255,255,0.08)", flexWrap: "wrap" }}>
<button onClick={onBack} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.08)", color: "#cbd5e1", cursor: "pointer", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontFamily: "inherit", fontWeight: 700 }}>Back</button>
<Avatar initials={faculty.avatar} src={faculty.avatarUrl} color={faculty.avatarColor} size={50} />
<div style={{ flex: 1 }}>
<div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 15 }}>{faculty.name}</div>
<div style={{ color: "#64748b", fontSize: 11 }}>{faculty.designation} - {faculty.employeeId}</div>
</div>
<div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
<div style={{ background: "rgba(30,41,59,0.92)", border: "1px solid rgba(148,163,184,0.13)", borderRadius: 10, padding: "8px 14px", textAlign: "center", minWidth: 92 }}>
<div style={{ color: "#94a3b8", fontSize: 9, textTransform: "uppercase", letterSpacing: 0.6 }}>{reviewerLabel} Part A</div>
<div style={{ color: "#818cf8", fontWeight: 800, fontSize: 16 }}>{partA.toFixed(1)}</div>
</div>
<div style={{ background: "rgba(30,41,59,0.92)", border: "1px solid rgba(148,163,184,0.13)", borderRadius: 10, padding: "8px 14px", textAlign: "center", minWidth: 92 }}>
<div style={{ color: "#94a3b8", fontSize: 9, textTransform: "uppercase", letterSpacing: 0.6 }}>{reviewerLabel} Part B</div>
<div style={{ color: "#38bdf8", fontWeight: 800, fontSize: 16 }}>{partB.toFixed(1)}</div>
</div>
<div style={{ background: "rgba(30,41,59,0.92)", border: "1px solid rgba(148,163,184,0.13)", borderRadius: 10, padding: "8px 14px", textAlign: "center", minWidth: 92 }}>
<div style={{ color: "#94a3b8", fontSize: 9, textTransform: "uppercase", letterSpacing: 0.6 }}>{reviewerLabel} Part C</div>
<div style={{ color: "#2dd4bf", fontWeight: 800, fontSize: 16 }}>{partC.toFixed(1)}</div>
</div>
<div style={{ background: "rgba(30,41,59,0.92)", border: "1px solid rgba(148,163,184,0.13)", borderRadius: 10, padding: "8px 14px", textAlign: "center", minWidth: 92 }}>
<div style={{ color: "#94a3b8", fontSize: 9, textTransform: "uppercase", letterSpacing: 0.6 }}>{reviewerLabel} Part D</div>
<div style={{ color: "#f59e0b", fontWeight: 800, fontSize: 16 }}>{partD.toFixed(1)}</div>
</div>
<div style={{ background: g.bg, border: `2px solid ${g.color}40`, borderRadius: 10, padding: "8px 14px", textAlign: "center", minWidth: 100 }}>
<div style={{ color: g.color, fontSize: 9, textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 700 }}>{reviewerLabel} Total</div>
<div style={{ color: g.color, fontWeight: 800, fontSize: 16 }}>{total.toFixed(1)}<span style={{ fontSize: 10, color: "#94a3b8" }}>/{reviewerMaxScores.grand}</span></div>
</div>
</div>
</div>
 {/* Section switcher */}
<div style={{ display: "inline-flex", gap: 6, marginBottom: 16, padding: 4, background: "#eef2ff", border: "1px solid #dbe3ff", borderRadius: 12, width: "fit-content", flexWrap: "wrap" }}>
 {[["partA", "Part A"], ["partB", "Part B"], ["partC", "Part C"], ["partD", "Part D"], ["summary", "Summary"]].map(([id, label]) =>(
<button key={id} onClick={() =>{
 setSectionView(id);
 requestAnimationFrame(() =>{
 window.scrollTo({ top: 0, left: 0, behavior: "auto" });
 });
 }}
 style={{ padding: "8px 18px", border: "none", borderRadius: 9, cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 800, background: sectionView === id ? "#312e81" : "transparent", color: sectionView === id ? "#e0e7ff" : "#475569", boxShadow: sectionView === id ? "0 8px 18px rgba(49,46,129,0.22)" : "none" }}>
 {label}
</button>
 ))}
</div>

 {["partA", "partB", "partC", "partD"].includes(sectionView) && (
<fieldset disabled={reviewLocked} style={{ border: "none", padding: 0, margin: 0 }}>
<MyAppraisalForm faculty={faculty} hodData={hodData} setHodData={setHodData} reviewerLabel={reviewerLabel} sectionView={sectionView} />
</fieldset>
 )}

 {["partA", "partB", "partC", "partD"].includes(sectionView) && !reviewLocked && (
<div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 10, margin: "12px 0 14px", flexWrap: "wrap" }}>
<span style={{ color: "#64748b", fontSize: 11, fontWeight: 700 }}>{draftStatus}</span>
<button
 type="button"
 onClick={handleSaveDraft}
 disabled={savingDraft}
 style={{ padding: "10px 22px", background: "#fff", color: savingDraft ? "#94a3b8" : "#2563eb", border: "1.5px solid #2563eb", borderRadius: 7, cursor: savingDraft ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 13, fontFamily: "inherit" }}
>
 {savingDraft ? "Saving..." : "Save as Draft"}
</button>
<button
 type="button"
 onClick={handleSaveAndNext}
 disabled={savingDraft}
 style={{ padding: "10px 22px", background: savingDraft ? "#94a3b8" : "#2563eb", color: "#fff", border: "none", borderRadius: 7, cursor: savingDraft ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 13, fontFamily: "inherit" }}
>
 {savingDraft ? "Saving..." : "Save & Next"}
</button>
</div>
 )}

 {sectionView === "summary" && (
<div className="hod-review-summary-grid" style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 14, display: "grid", gap: 14, boxShadow: "0 1px 6px rgba(0,0,0,.06)" }}>
<ScoreCard
 title="Faculty Score"
 subtitle="Self score for the engineering appraisal form."
 totals={{ partA: facultySummary.partA, partB: facultySummary.partB, partC: facultySummary.partC, partD: facultySummary.partD, total: facultySummary.total }}
 maxScores={{ partA: facultySummary.partAMax, partB: facultySummary.partBMax, partC: facultySummary.partCMax, partD: facultySummary.partDMax, grand: facultySummary.grandMax }}
 accent="#0ea5e9"
 extraContent={<SummaryOtherInfoField value={summaryOtherInfoValueFrom(faculty)} readOnly rows={4} />}
/>
<ScoreCard
 title={`${reviewerLabel} Score`}
 subtitle={`${reviewerLabel} score for the engineering appraisal form.`}
 totals={{ partA, partB, partC, partD, total }}
 maxScores={reviewerMaxScores}
 isFinal
 accent="#7c3aed"
 sideContent={(
<div style={{ background: "#eff6ff", border: "2px solid #93c5fd", borderRadius: 10, padding: "14px 15px", display: "flex", flexDirection: "column", minWidth: 0, boxShadow: "0 0 0 4px rgba(147,197,253,0.16), 0 14px 28px rgba(37,99,235,0.08)" }}>
<div style={{ fontSize: 11, fontWeight: 900, color: "#1d4ed8", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 5 }}>{reviewerLabel} Remarks Required</div>
<div style={{ color: "#1e40af", fontSize: 11, fontWeight: 700, marginBottom: 10 }}>Please enter remarks before submitting the review.</div>
<textarea value={remarks} onChange={e =>setRemarks(e.target.value)} rows={7} readOnly={reviewLocked}
 placeholder="Enter your remarks, observations, and recommendations for this faculty member..."
 style={{ width: "100%", height: 235, minHeight: 235, border: "1px solid #bfdbfe", borderRadius: 8, padding: "10px 11px", fontSize: 12, lineHeight: 1.5, fontFamily: "inherit", resize: "none", boxSizing: "border-box", background: "#fff", color: "#334155", outline: "none" }} />
</div>
 )}
/>

 {!reviewLocked && (
<label className="appraisal-confirmation-card" style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, marginBottom: 0, color: "#334155", fontSize: 12, lineHeight: 1.5, cursor: "pointer" }}>
<input
 type="checkbox"
 checked={reviewConfirmed}
 onChange={(e) =>setReviewConfirmed(e.target.checked)}
 style={{ margin: 0, accentColor: "#16a34a", flexShrink: 0 }}
 />
<span>I have verified all the details and confirm that the information provided is correct. I am responsible for the accuracy of this data.</span>
</label>
 )}

<div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
<span style={{ color: "#64748b", fontSize: 11, fontWeight: 700 }}>{draftStatus}</span>
<div style={{ display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap", marginLeft: "auto" }}>
<button onClick={onBack} style={{ padding: "9px 22px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 7, cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: "inherit" }}>{reviewLocked ? "Close" : "Cancel"}</button>
 {!reviewLocked && (
<>
<button
 onClick={handleSaveDraft}
 disabled={savingDraft}
 style={{ padding: "10px 22px", background: savingDraft ? "#94a3b8" : "#2563eb", color: "#fff", border: "none", borderRadius: 7, cursor: savingDraft ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 13, fontFamily: "inherit" }}
>
 {savingDraft ? "Saving..." : "Save Draft"}
</button>
{canReject && (
<button
 onClick={() =>{
 if (window.confirm("Reject this appraisal and send it back to the user for editing?")) {
 onSubmit(faculty.id, { partA, partB, partC, partD, total }, remarks, buildHodSectionScores(faculty, hodData), reviewConfirmed, "rejected");
 }
 }}
 disabled={!reviewConfirmed || !remarks.trim()}
 style={{ padding: "10px 22px", background: (reviewConfirmed && remarks.trim()) ? "#dc2626" : "#94a3b8", color: "#fff", border: "none", borderRadius: 7, cursor: (reviewConfirmed && remarks.trim()) ? "pointer" : "not-allowed", fontWeight: 700, fontSize: 13, fontFamily: "inherit" }}
>
 Reject Form
</button>
)}
<button onClick={() =>onSubmit(faculty.id, { partA, partB, partC, partD, total }, remarks, buildHodSectionScores(faculty, hodData), reviewConfirmed)}
 disabled={!reviewConfirmed || !remarks.trim()}
 style={{ padding: "10px 28px", background: (reviewConfirmed && remarks.trim()) ? "#059669" : "#64748b", color: "#fff", border: "none", borderRadius: 7, cursor: (reviewConfirmed && remarks.trim()) ? "pointer" : "not-allowed", fontWeight: 700, fontSize: 13, fontFamily: "inherit" }}>
 Submit {reviewerLabel} Review
</button>
</>
 )}
</div>
</div>
</div>
 )}
</div>
 );
}

// - Main HOD Dashboard -
export default function HODDashboard({
 reviewerRole = "hod",
 reviewerLabel = "HOD",
 reviewerDesignation = "Professor & Head",
 forwardedToLabel = "Director",
} = {}) {
 const [activeMainTab, setActiveMainTab] = useState("myAppraisal");
 const [hodAppraisalTab, setHodAppraisalTab] = useState("partA");
 const [reviewingFaculty, setReviewingFaculty] = useState(null);
 const [reviewLoading, setReviewLoading] = useState(null);
 const [facultyList, setFacultyList] = useState([]);
 const [selectedAcademicYear, setSelectedAcademicYear] = useState(() => getActiveAcademicYear());
 const [availableCycles, setAvailableCycles] = useState(() => storedAcademicYearCycles());

 const hodSchool = sessionStorage.getItem("school");
 const hodDept = sessionStorage.getItem("department");
 const academicYearOptions = availableCycles.length ? availableCycles : [{ academic_year: selectedAcademicYear || APP_INFO.DEFAULT_AY, is_open: true }];

 const handleReviewAcademicYearChange = (academicYear) => {
 const nextAcademicYear = setActiveAcademicYear(academicYear);
 setSelectedAcademicYear(nextAcademicYear);
 window.dispatchEvent(new CustomEvent("academicYearChanged", { detail: { academicYear: nextAcademicYear } }));
 };

 useEffect(() =>{
 const syncAcademicYear = (event) =>{
 setSelectedAcademicYear(event?.detail?.academicYear || getActiveAcademicYear());
 setAvailableCycles(storedAcademicYearCycles());
 };
 window.addEventListener("academicYearChanged", syncAcademicYear);
 return () =>window.removeEventListener("academicYearChanged", syncAcademicYear);
 }, []);

 useEffect(() =>{
 const loadReviewQueue = async () =>{
 try {
 const items = await fetchReviewQueueForRole({
 reviewerRole,
 reviewerProfile: { ...profileFromsessionStorage(), appraisal_role: reviewerRole, school: hodSchool, department: hodDept },
 academicYear: selectedAcademicYear,
 schoolValues: [hodSchool],
 });
 setFacultyList(items);
 } catch (err) {
 console.error(`Could not load ${reviewerLabel} review queue:`, err);
 setFacultyList([]);
 }
 };

 loadReviewQueue();
 }, [hodDept, hodSchool, reviewerLabel, reviewerRole, selectedAcademicYear]);

 const [filterStatus, setFilterStatus] = useState("All");
 const [showLogoutModal, setShowLogoutModal] = useState(false);


 const isHodPending = (item) =>{
 const s = item.status || "";
 if (isPendingReviewStatusFor([s, item.workflowStatus, item.workflow_status], reviewerRole)) return true;
 return s === "pending_hod" || s === "Pending Review" ||
 (n(item.hodTotal)<= 0 && !String(item.hodRemarks || "").trim() && s !== "Reviewed" && s !== "pending_director" && s !== "hod_reviewed" && !/(?:HOD|Center Head)\s*(Reviewed|Rejected)/i.test(s) && s !== "completed");
 };
 const isHodReviewed = (item) =>{
 const s = item.status || "";
 if (isPendingReviewStatusFor([s, item.workflowStatus, item.workflow_status], reviewerRole)) return false;
 return n(item.hodTotal) >0 || String(item.hodRemarks || "").trim() !== "" || s === "Reviewed" || s === "pending_director" || s === "hod_reviewed" || /(?:HOD|Center Head)\s*Reviewed/i.test(s);
 };

 const pendingCount = facultyList.filter(isHodPending).length;
 const reviewedCount = facultyList.filter(isHodReviewed).length;

 const navItems = [
 { id: "myAppraisal", icon: "", label: "My Appraisal", sub: "View your self-appraisal form" },
 { id: "approvals", icon: "", label: "Faculty's Appraisal", sub: `${pendingCount} awaiting review`, badge: pendingCount },
 ];
 const handleSubmitReview = async (id, scores, remarks, sectionScores, reviewConfirmed = false, decision = "approved") =>{
 if (!reviewConfirmed) {
 alert("Please verify and confirm the accuracy declaration before submitting the review.");
 return;
 }
 if (!remarks?.trim()) {
 alert("Remarks are mandatory. Please enter your remarks before submitting the review.");
 return;
 }
 const item = facultyList.find((faculty) =>faculty.id === id);
 if (!item) return;

 try {
 await submitWorkflowReview({
 subjectEmail: item.email,
 academicYear: item.academicYear || item.academic_year || item.info?.ay || APP_INFO.DEFAULT_AY || "2026-2027",
 reviewerRole,
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

 const status = decision === "rejected" ? rejectedStatusFor(reviewerRole) : reviewedStatusFor(reviewerRole);
 setFacultyList(prev =>prev.map(f =>f.id === id ? { ...f, ...sectionScores, innovHod: sectionScores?.innovativeTeaching?.hod ?? f.innovHod, status, workflowStatus: status, hodPartA: scores.partA, hodPartB: scores.partB, hodPartC: scores.partC, hodPartD: scores.partD, hodTotal: scores.total, hodRemarks: remarks } : f));
 setReviewingFaculty(null);
 alert(decision === "rejected" ? "Appraisal rejected and sent back for editing." : `${reviewerLabel} review approved and forwarded to ${forwardedToLabel}.`);
 } catch (err) {
 console.error(`Could not submit ${reviewerLabel} review:`, err);
 alert(`Unable to submit ${reviewerLabel} review.\n\n${err.message}`);
 }
 };

 const filtered = filterStatus === "All" ? facultyList : (filterStatus === "Pending Review" ? facultyList.filter(isHodPending) : facultyList.filter(isHodReviewed));


 const handleMyAppraisalSectionChange = (section) =>{
 setHodAppraisalTab(section);
 requestAnimationFrame(() =>{
 window.scrollTo({ top: 0, left: 0, behavior: "auto" });
 });
 };
 return (
<DashboardLayout
 appInfo={APP_INFO}
 showLogoutModal={showLogoutModal}
 onCancelLogout={() =>setShowLogoutModal(false)}
 containerStyle={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: "inherit", background: "#f8fafc", color: "#1e293b" }}
 mainStyle={{ flex: 1, padding: "24px 30px", display: "flex", flexDirection: "column", gap: 18, overflowX: "auto" }}
 sidebar={(
<DashboardSidebar
 appInfo={APP_INFO}
 navItems={navItems}
 activeTab={activeMainTab}
 onTabSelect={(tab) =>{ setActiveMainTab(tab); setReviewingFaculty(null); }}
 showSectionSelector={activeMainTab === "myAppraisal"}
 sectionTab={hodAppraisalTab}
 onSectionChange={handleMyAppraisalSectionChange}
 profileSubtitle={`HOD - ${sessionStorage.getItem("department")?.split(" ")[0] || ""}`}
 onLogout={() =>setShowLogoutModal(true)}
 showLogoutSpacer
/>
 )}
>

{activeMainTab === "myAppraisal" && <MyAppraisalSection sectionTab={hodAppraisalTab} onSectionTabChange={handleMyAppraisalSectionChange} defaultDesignation={sessionStorage.getItem("role") === reviewerRole ? reviewerDesignation : ""} defaultAcademicYear={sessionStorage.getItem("academicYear") || APP_INFO.DEFAULT_AY} titleNameFallback="HOD" subtitleSeparator=" - " />}

 {activeMainTab === "approvals" && !reviewingFaculty && (
<>
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
<div>
<h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#0f172a", letterSpacing: -0.5 }}>Faculty's Appraisal</h1>
<div style={{ marginTop: 5, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", color: "#64748b", fontSize: 11 }}>
<span>{sessionStorage.getItem("department") || ""}</span>
<span>AY</span>
<select
 value={selectedAcademicYear}
 onChange={(event) =>handleReviewAcademicYearChange(event.target.value)}
 style={{ height: 28, border: "1px solid #cbd5e1", borderRadius: 7, background: "#fff", color: "#0f172a", fontSize: 11, fontWeight: 800, padding: "3px 28px 3px 9px", fontFamily: "inherit", outline: "none" }}
>
 {academicYearOptions.map((cycle) =>(
 <option key={cycle.academic_year} value={cycle.academic_year}>
 {cycle.academic_year} {cycle.is_open ? "(Active)" : "(Closed)"}
 </option>
 ))}
</select>
</div>
</div>
<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
<div style={{ fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 20, background: "#fef3c7", color: "#92400e" }}>{pendingCount} Pending</div>
<div style={{ fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 20, background: "#d1fae5", color: "#065f46" }}>{reviewedCount} Reviewed</div>
<AppraisalHeaderImage />
</div>
</div>

 {/* Filter */}
<div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", background: "#fff", borderRadius: 9, boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
<span style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>Filter:</span>
 {["All", "Pending Review", "Reviewed"].map(f =>(
<button key={f} onClick={() =>setFilterStatus(f)}
 style={{ fontSize: 11, padding: "4px 12px", border: "1px solid #e2e8f0", borderRadius: 20, cursor: "pointer", fontFamily: "inherit", background: filterStatus === f ? "#0f172a" : "none", color: filterStatus === f ? "#f1f5f9" : "#475569" }}>
 {f}
</button>
 ))}
</div>

 {/* Faculty Grid */}
<div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14 }}>
 {filtered.map(faculty =>{
 const facultySummary = standardSubmittedScoreSummary(faculty);
 const courseFilePartA = Array.isArray(faculty.courseFile)
 ? (() =>{
 const filled = faculty.courseFile.filter(row =>String(row?.score ?? "").trim() !== "");
 return filled.length ? filled.reduce((total, row) =>total + courseFileRowScore(row), 0) / filled.length : 0;
 })()
 : n(faculty.courseFile?.score);
 const facPartA = [
 ...(faculty.lectures || []).map(r =>n(r.score)),
 courseFilePartA, n(faculty.innovScore),
 ...(faculty.projects || []).map(r =>n(r.score)),
 ...(faculty.quals || []).map(r =>n(r.score)),
 ...(faculty.feedback || []).map(r =>n(r.score)),
 ...(faculty.deptActs || []).map(r =>n(r.score)),
 ...(faculty.uniActs || []).map(r =>n(r.score)),
 ...(faculty.society || []).map(r =>societyRowScore(r)),
 ...(faculty.industry || []).map(r =>n(r.score)),
 ].reduce((a, b) =>a + b, 0);

 const facPartB = [
 ...(faculty.journals || []).map(r =>n(r.score)),
 ...(faculty.books || []).map(r =>n(r.score)),
 ...(faculty.confs || []).map(r =>n(r.score)),
 ...(faculty.patents || []).map(r =>n(r.score)),
 ].reduce((a, b) =>a + b, 0);

 const docCount = uploadedDocCount(faculty.docs, faculty);

 
return (
<div key={faculty.id} style={{ background: "#fff", borderRadius: 12, padding: "18px 20px", boxShadow: "0 1px 6px rgba(0,0,0,.07)", display: "flex", flexDirection: "column", gap: 14 }}>
<div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
<Avatar initials={faculty.avatar} src={faculty.avatarUrl} color={faculty.avatarColor} size={58} />
<div style={{ flex: 1 }}>
<div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 2 }}>{faculty.name}</div>
<div style={{ fontSize: 11, color: "#475569", marginBottom: 2 }}>{faculty.designation}</div>
<div style={{ fontSize: 10, color: "#94a3b8", fontFamily: "monospace" }}>{faculty.employeeId}</div>
</div>
<StatusBadge status={faculty.status} />
</div>

<ReviewMetricsStrip
 metrics={[
 { label: "Part A", val: facultySummary.partA, max: facultySummary.partAMax, color: "#6366f1" },
 { label: "Part B", val: facultySummary.partB, max: facultySummary.partBMax, color: "#0ea5e9" },
 { label: "Part C", val: facultySummary.partC, max: facultySummary.partCMax, color: "#10b981" },
 { label: "Part D", val: facultySummary.partD, max: facultySummary.partDMax, color: "#f59e0b" },
 { label: "Total", val: facultySummary.total, max: facultySummary.grandMax, color: "#4338ca" },
 ]}
 docs={faculty.docs}
/>

<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f1f5f9", paddingTop: 12 }}>
<div style={{ fontSize: 10, color: "#94a3b8" }}>Submitted: {faculty.submittedOn}</div>
<button
 disabled={reviewLoading === faculty.id}
 onClick={async () =>{
 setReviewLoading(faculty.id);
 try {
 const academicYear = faculty.academic_year || faculty.academicYear || selectedAcademicYear || APP_INFO.DEFAULT_AY || "2026-2027";
 const data = await fetchSavedAppraisal({
 facultyEmail: faculty.email,
 academicYear,
 reviewerRole,
 });
 const form = data?.payload?.form || data?.form || {};
 const docs = data?.payload?.docs || data?.docs || {};
 const mergedForm = preserveSavedReviewScores(form, faculty);
 const declaration = data?.declaration || faculty.declaration || null;
 setReviewingFaculty({ ...faculty, ...mergedForm, docs, declaration, academicYear, academic_year: academicYear, previousYearResponse: data, previousYearResultOnly: isLegacyTwoPartAcademicYear(academicYear), status: declaration?.status || data?.status || faculty.status, workflowStatus: declaration?.status || data?.workflowStatus || faculty.workflowStatus });
 } catch (err) {
 alert(`Unable to open submitted form.\n\n${err.message}`);
 } finally {
 setReviewLoading(null);
 }
 }}
 style={{ fontSize: 11, padding: "7px 18px", background: isHodReviewed(faculty) ? "#1e293b" : "#312e81", color: "#f1f5f9", border: "none", borderRadius: 6, cursor: reviewLoading === faculty.id ? "wait" : "pointer", fontWeight: 700, fontFamily: "inherit", opacity: reviewLoading === faculty.id ? 0.7 : 1 }}>
 {reviewLoading === faculty.id ? "Loading..." : isHodReviewed(faculty) ? "View Review" : "Review Form"}
</button>
</div>
</div>
 );
 })}
</div>

 {filtered.length === 0 && (
<div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>
<div style={{ fontSize: 32, marginBottom: 8 }}>Done</div>
<div style={{ fontWeight: 700, color: "#0f172a" }}>All caught up!</div>
<div style={{ color: "#64748b", fontSize: 12 }}>No forms match the selected filter.</div>
</div>
 )}
</>
 )}

 {/* REVIEW PANEL */}
 {activeMainTab === "approvals" && reviewingFaculty && (
reviewingFaculty.previousYearResultOnly ? (
<PreviousYearAuthorityResult item={reviewingFaculty} onBack={() =>setReviewingFaculty(null)} />
) : (
<ReviewPanel
faculty={reviewingFaculty}
onBack={() =>setReviewingFaculty(null)}
 onSubmit={handleSubmitReview}
 readOnly={isHodReviewed(reviewingFaculty)}
reviewerLabel={reviewerLabel}
reviewerRole={reviewerRole}
/>
)
 )}
</DashboardLayout>
 );
}










