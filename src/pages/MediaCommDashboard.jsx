/* eslint-disable no-unused-vars, react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import { Avatar, LogoutConfirmModal, ScoreBar, StatusBadge } from "../components/dashboard/dashboardPrimitives";
import { getSchoolKey } from "../constants/universityHierarchy";
import { api } from "../services/api";
import {
 ACR_DETAIL_POINTS,
 APP_INFO,
 createAcrRows,
 FORM_SCHOOL_CODES,
 FORM_TYPES,
 fetchSavedAppraisal,
 loadAppraisalDocuments,
 loadSavedAppraisal,
 mergeFacultyInfo,
 saveAppraisalDraftSection,
 submitAppraisal,
 fetchReviewQueueForRole,
 loadReviewerDraft,
 saveReviewerDraft,
 submitWorkflowReview,
 buildReviewRemarks,
 openFullFormReport,
 generateMediaCommReport,

 INNOVATIVE_METHODS,
 SCORE_LIMITS,
 averageSectionScore,
 clampScore,
 courseFileRowScore,
 effectiveMaxScore,
 feedbackAverage,
 feedbackRowScore,
 feedbackSectionScore,
 innovativeSelectionsFromDetails,
 innovativeTeachingScore,
 isValidDDMMYYYY,
 maskDateDDMMYYYY,
 normalizeAutoScores,
 projectGuidanceRowMax,
 researchGuidanceRowMax,
 researchGuidanceScore,
 clampReviewScore,
 reviewRowMaxForSection,
 reviewSectionScore,
 rowHasAnyValue,
 rowHasReviewableData,
 scoreSectionRows,
 selfEffectivePartAMax,
 societyRowLocked,
 societyRowScore,
 sumSectionScore,
 toggleInnovativeMethod,
 validateCompleteRows,
 AppraisalHeaderImage,
 SummaryOtherInfoField,
 summaryOtherInfoValueFrom,
 RejectionNotice,
 DocCell,
 ViewDocsCell,
 SectionSaveFooter,
} from "../features/faculty-appraisal";
import { canReviewerRejectProfile, getReviewChain, pendingStatusFor, profileFromsessionStorage, reviewedStatusFor, roleLabel, visiblePreviousReviewRoles, workflowValidationError, isAppraisalFinalisedByVc, isRejectedStatus, isPendingReviewStatusFor, hasActiveRejection, reviewListFrom } from "../utils/hierarchy";
import { n, pct, RO, TI } from "../features/faculty-appraisal/shared";

import { emptyMediaForm, ALL_ARRAY_KEYS, titleCase, calculateMediaTotals, getMediaEffectiveMaxScores, validateMediaBeforeSubmit, mergeForm, preserveSavedReviewScores, PART_A_SECTIONS, PART_B_SECTIONS, MediaForm, MediaCommAuthorityReviewPanel, SectionSelector, AccuracyCheckbox, CompactAuthoritySummaryCard, isReviewerReviewComplete, normalizeScoresForSubmit, summaryRow, b8summaryRow, SECTION_OPTIONS, SummaryBox, WorkflowTracker, ACCENT, ACCENT2, userInitials } from "../features/faculty-appraisal";
import { loadClosedAppraisal } from "../services/appraisalPersistence";

function InlineSvgIcon({ paths, size = 16, strokeWidth = 2.2 }) {
 return (
   <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
     {paths.map((path) => <path key={path} d={path} />)}
   </svg>
 );
}

const SUMMARY_ICONS = {
 book: ["M4 19.5V5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-1.5Z", "M8 7h6M8 11h8M8 15h5"],
 flask: ["M9 3h6", "M10 3v6l-4 8a3 3 0 0 0 2.7 4.3h6.6A3 3 0 0 0 18 17l-4-8V3", "M8 16h8"],
 building: ["M4 21V7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v14", "M20 21v-9a2 2 0 0 0-2-2h-2", "M8 9h4M8 13h4M8 17h4"],
 document: ["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z", "M14 2v6h6", "M8 13h8M8 17h6"],
 sigma: ["M18 4H7l6 8-6 8h11"],
 report: ["M6 2h9l5 5v15H6z", "M14 2v6h6", "M9 13h6M9 17h6"],
 send: ["M22 2 11 13", "M22 2 15 22l-4-9-9-4 20-7Z"],
 user: ["M20 21a8 8 0 0 0-16 0", "M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"],
 cap: ["M12 3 3 7l9 4 9-4-9-4Z", "M5 10v5c2 2 12 2 14 0v-5", "M12 11v8"],
};

function ScoreBadge({ score, max, color, tone }) {
 return (
   <span style={{ display: "inline-flex", justifyContent: "center", minWidth: 92, borderRadius: 999, padding: "6px 12px", background: tone, color, fontSize: 13, fontWeight: 900, lineHeight: 1, whiteSpace: "nowrap" }}>
     {score.toFixed(1)}/{max}
   </span>
 );
}

function SummaryRow({ label, score, max, color, tone, iconTone, icon }) {
 return (
   <tr className="appraisal-summary-row">
     <td style={{ padding: 0, border: 0 }}>
       <div style={{ display: "flex", alignItems: "center", gap: 14, minHeight: 52, padding: "10px 12px" }}>
         <span style={{ width: 32, height: 32, borderRadius: 9, background: iconTone, color, border: `1px solid ${color}20`, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
           <InlineSvgIcon paths={SUMMARY_ICONS[icon]} size={17} />
         </span>
         <span style={{ color: "#1f2937", fontSize: 13, fontWeight: 850, lineHeight: 1.35 }}>{label}</span>
       </div>
     </td>
     <td style={{ width: 150, padding: "10px 12px", border: 0, textAlign: "right", verticalAlign: "middle" }}>
       <ScoreBadge score={score} max={max} color={color} tone={tone} />
     </td>
   </tr>
 );
}

export default function MediaCommDashboard({ fixedRole }) {
 const navigate = useNavigate();
 const role = fixedRole || sessionStorage.getItem("role") || "faculty";
 const profile = profileFromsessionStorage();
 const [activeTab, setActiveTab] = useState(role === "faculty" ? "my" : "approvals");
 const [selfSectionView, setSelfSectionView] = useState("partA");
 const [form, setForm] = useState(emptyMediaForm);
 const [docs, setDocs] = useState({});
 const [queue, setQueue] = useState([]);
 const [reviewing, setReviewing] = useState(null);
 const [reviewLoading, setReviewLoading] = useState(null);
 const [loadingQueue, setLoadingQueue] = useState(false);
 const [submitting, setSubmitting] = useState(false);
 const [confirmed, setConfirmed] = useState(false);
 const [attachmentsConfirmed, setAttachmentsConfirmed] = useState(false);

 const [showLogoutModal, setShowLogoutModal] = useState(false);
 const [sectionSaveStatus, setSectionSaveStatus] = useState({ partA: false, partB: false, partC: false, partD: false });
 const [savingSection, setSavingSection] = useState(null);
 const [declaration, setDeclaration] = useState(null);
 const [reviews, setReviews] = useState([]);
 const [availableCycles, setAvailableCycles] = useState([]);
 const userEmail = sessionStorage.getItem("username") || sessionStorage.getItem("email") || localStorage.getItem("username") || localStorage.getItem("email") || "";
 const academicYear = form.info?.ay || sessionStorage.getItem("academicYear") || "2026-2027";
 const currentSchoolValue = form.info?.school || profile.school || sessionStorage.getItem("school") || sessionStorage.getItem("schoolName") || "SoMCS";
 const schoolCode = isMediaCommSchool(currentSchoolValue) &&
    !String(currentSchoolValue).toLowerCase().includes("somcs") &&
    !String(currentSchoolValue).toLowerCase().includes("media")
      ? "SoHSS"
      : "SoMCS";

 useEffect(() => {
   const fetchCycles = async () => {
     try {
       const res = await api.get("/academic-years/available");
       const cycles = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
       if (cycles.length > 0) {
          const currentStartYear = parseInt(academicYear.split("-")[0], 10) || 2026;
          const minYear = currentStartYear - 4;
          const formatted = cycles
            .map((c) => ({
              academic_year: c.academic_year || c.academicYear || c.year || String(c),
              is_open: c.is_open !== undefined ? Boolean(c.is_open) : true,
            }))
            .filter((c) => {
              const yStart = parseInt(c.academic_year.split("-")[0], 10);
              return !isNaN(yStart) && yStart >= minYear;
            });
          setAvailableCycles(formatted);
       }
     } catch (err) {
       console.warn("Could not fetch available cycles:", err);
     }
   };
   fetchCycles();
 }, []);

  const academicYearOptions = availableCycles.length > 0
    ? availableCycles
    : [
        { academic_year: "2026-2027", is_open: true },
        { academic_year: "2025-2026", is_open: false },
        { academic_year: "2024-2025", is_open: false },
      ];

 const selectedCycle = academicYearOptions.find((c) => c.academic_year === academicYear);
 const isSelectedCycleClosed = selectedCycle ? !selectedCycle.is_open : false;
 const workflowRejected = hasActiveRejection(declaration, reviews);
 const locked = isSelectedCycleClosed || (Boolean(declaration) && !workflowRejected);
 const totals = calculateMediaTotals(form, "score");
 const canSelfSubmit = role !== "vc";

 const handleAcademicYearChange = (newAy) => {
   setForm((prev) => ({ ...prev, info: { ...prev.info, ay: newAy } }));
   sessionStorage.setItem("academicYear", newAy);
 };

  const handleGenerateReport = () => {
    openFullFormReport({
      title: `${schoolCode} — Faculty Appraisal Report`,
      subtitle: `Academic Year: ${academicYear}`,
      form,
      docs,
      partASections: PART_A_SECTIONS,
      partBSections: PART_B_SECTIONS,
      totals,
      maxScores: totals.maxScores,
      scoreRoles: ["score"],
      roleLabel,
      declaration,
    });
  };

 const setters = useMemo(() =>Object.fromEntries([
 ["setInfo", (value) =>setForm((prev) =>({ ...prev, info: { ...prev.info, ...value } }))],
 ...ALL_ARRAY_KEYS.map((key) =>[`set${titleCase(key)}`, (value) =>setForm((prev) =>({ ...prev, [key]: key === "acr" ? createAcrRows(value) : value }))]),
 ["setInnovDetails", (value) =>setForm((prev) =>({ ...prev, innovDetails: value }))],
 ["setInnovScore", (value) =>setForm((prev) =>({ ...prev, innovScore: value }))],
 ["setInnovRows", (value) =>setForm((prev) =>({ ...prev, innovRows: value }))],
 ["setInnovHod", (value) =>setForm((prev) =>({ ...prev, innovHod: value }))],
 ["setInnovDirector", (value) =>setForm((prev) =>({ ...prev, innovDirector: value }))],
 ["setInnovDean", (value) =>setForm((prev) =>({ ...prev, innovDean: value }))],
 ["setInnovVc", (value) =>setForm((prev) =>({ ...prev, innovVc: value }))],
 ["setSummaryOtherInfo", (value) =>setForm((prev) =>({ ...prev, summaryOtherInfo: value }))],
 ["setSectionSaveStatus", (value) =>setSectionSaveStatus((prev) =>({ ...prev, ...(value || {}) }))],
 ]), []);

 useEffect(() =>{
 if (!userEmail || !academicYear || !canSelfSubmit) return;
 setDocs({});
 const loadAll = async () =>{
 const data = await api.get("/appraisal/status", { params: { academic_year: academicYear } }).catch((err) =>{
 console.error("Could not load workflow status:", err);
 return null;
 });
 const declarationRow = data?.declaration || null;
 const loadedReviews = reviewListFrom(data?.reviews);
 setDeclaration(declarationRow);
 setReviews(loadedReviews);
 const loader = isSelectedCycleClosed ? loadClosedAppraisal : loadSavedAppraisal;
 await Promise.all([
 loader({ facultyEmail: userEmail, academicYear, setters }),
 loadAppraisalDocuments({ facultyEmail: userEmail, academicYear, setDocs }),
 ]);
 };
  loadAll().catch((err) =>console.error(`Could not load ${schoolCode} appraisal:`, err));
 }, [userEmail, academicYear, setters, canSelfSubmit, isSelectedCycleClosed]);

 const loadQueue = async () =>{
 if (role === "faculty") return;
 setLoadingQueue(true);
 try {
 const items = await fetchReviewQueueForRole({
 reviewerRole: role,
 reviewerProfile: { ...profile, appraisal_role: role },
 schoolValues: FORM_SCHOOL_CODES[FORM_TYPES.MEDIA_COMM],
 });
 setQueue(items.filter((item) =>FORM_SCHOOL_CODES[FORM_TYPES.MEDIA_COMM].includes(getSchoolKey(item.school))));
 } catch (err) {
  console.error(`Could not load ${schoolCode} review queue:`, err);
 setQueue([]);
 } finally {
 setLoadingQueue(false);
 }
 };

 useEffect(() =>{
 loadQueue();
 }, [role, profile.school, profile.department]);

 const isSelfSectionOpen = (_section) =>true;

 const handleSelfSectionChange = (section) =>{
 setSelfSectionView(section);
 requestAnimationFrame(() =>{
 window.scrollTo({ top: 0, left: 0, behavior: "auto" });
 });
 };

 const handleSaveSelfSection = async (section) =>{
 if (locked) return;
 if (!userEmail) {
 alert("Please login again before saving. Your session email was not found.");
 navigate("/login", { replace: true });
 return;
 }
 const nextStatus = { ...sectionSaveStatus, [section]: true };
 setSavingSection(section);
 try {
 await saveAppraisalDraftSection({
 facultyEmail: userEmail,
 academicYear,
 form: { ...form, sectionSaveStatus: nextStatus },
 docs,
 totals: {
 partATotal: totals.partA,
 partBTotal: totals.partB,
 partCTotal: totals.partC,
 partDTotal: totals.partD,
 grandTotal: totals.total,
 effectivePartAMax: totals.maxScores.partA,
 effectivePartBMax: totals.maxScores.partB,
 effectivePartCMax: totals.maxScores.partC,
 effectivePartDMax: totals.maxScores.partD,
 effectiveGrandMax: totals.maxScores.grand,
 },
 submitterProfile: { ...profile, appraisal_role: role },
 sectionSaveStatus: nextStatus,
 });
 setSectionSaveStatus(nextStatus);
 } catch (err) {
 if (err?.statusCode === 403 || err?.response?.status === 403) {
 setDeclaration((current) =>current || { status: "Submitted" });
 return;
 }
 alert(`Unable to save draft.\n\n${err.message}`);
 } finally {
 setSavingSection(null);
 }
 };

 const handleSubmitAppraisal = async () =>{
 if (locked) {
 alert("This appraisal has already been submitted and is locked for review.");
 return;
 }
 if (!confirmed || !attachmentsConfirmed) {
 alert("Please tick both declaration checkboxes before submitting.");
 return;
 }
 if (!userEmail) {
 alert("Please login again before submitting. Your session email was not found.");
 navigate("/login", { replace: true });
 return;
 }
 const submitterProfile = { ...profile, appraisal_role: role };
 const workflowError = workflowValidationError(submitterProfile);
 if (workflowError) {
 alert(workflowError);
 return;
 }
 const normalizedForm = normalizeScoresForSubmit(form);
 const validationErrors = validateMediaBeforeSubmit(normalizedForm, docs);
 if (validationErrors.length) {
 alert(validationErrors.join("\n"));
 return;
 }
 const confirmSubmit = window.confirm("Are you sure you want to submit your appraisal? This will save your data to the database.");
 if (!confirmSubmit) return;
 const finalSectionSaveStatus = { ...sectionSaveStatus, partA: true, partB: true, partC: true, partD: true };
 const submittedForm = {
 ...normalizedForm,
 sectionSaveStatus: finalSectionSaveStatus,
 };
 setSubmitting(true);
 try {
 const submittedAt = new Date().toISOString();
 await submitAppraisal({
 facultyEmail: userEmail,
 academicYear,
 totals: {
 partATotal: totals.partA,
 partBTotal: totals.partB,
 partCTotal: totals.partC,
 partDTotal: totals.partD,
 grandTotal: totals.total,
 effectivePartAMax: totals.maxScores.partA,
 effectivePartBMax: totals.maxScores.partB,
 effectivePartCMax: totals.maxScores.partC,
 effectivePartDMax: totals.maxScores.partD,
 effectiveGrandMax: totals.maxScores.grand,
 },
 form: submittedForm,
 docs,
 submitterProfile,
 activeProfile: submitterProfile,
 });
 setSectionSaveStatus(finalSectionSaveStatus);
 setDeclaration({ status: pendingStatusFor(getReviewChain({ ...profile, appraisal_role: role })[0]), submitted_at: submittedAt, updated_at: submittedAt });
 setReviews([]);
  alert(`${schoolCode} appraisal submitted successfully.`);
 } catch (err) {
 alert(`Unable to submit appraisal.\n\n${err.message}`);
 } finally {
 setSubmitting(false);
 }
 };

 const handleSubmitReview = async (id, scores, remarks, sectionScores, reviewConfirmed = false, decision = "approved") =>{
 if (!reviewConfirmed) {
 alert("Please verify and confirm the accuracy declaration before submitting the review.");
 return;
 }
 if (!remarks?.trim()) {
 alert("Remarks are mandatory. Please enter your remarks before submitting the review.");
 return;
 }
 const item = queue.find((entry) =>entry.id === id);
 if (!item) return;
 try {
 await submitWorkflowReview({
 subjectEmail: item.email,
 academicYear: item.academicYear || item.academic_year || item.info?.ay || APP_INFO.DEFAULT_AY || "2026-2027",
 reviewerRole: role,
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
 setReviewing(null);
 await loadQueue();
 alert(decision === "rejected" ? "Appraisal rejected and sent back for editing." : `${roleLabel(role)} review submitted successfully.`);
 } catch (err) {
 alert(`Unable to submit review.\n\n${err.message}`);
 }
 };

 const openSubmittedReview = async (item) =>{
 setReviewLoading(item.id);
 try {
 const data = await fetchSavedAppraisal({
 facultyEmail: item.email,
 academicYear: item.academic_year || item.academicYear || item.info?.ay || APP_INFO.DEFAULT_AY || "2026-2027",
 });
 const submittedForm = data?.payload?.form || data?.form || {};
 const submittedDocs = data?.payload?.docs || data?.docs || {};
 const mergedForm = preserveSavedReviewScores(submittedForm, item);
 const declaration = data?.declaration || item.declaration || null;
 setReviewing({ ...item, ...mergedForm, docs: submittedDocs, declaration, status: declaration?.status || data?.status || item.status, workflowStatus: declaration?.status || data?.workflowStatus || item.workflowStatus });
 } catch (err) {
 alert(`Unable to open submitted form.\n\n${err.message}`);
 } finally {
 setReviewLoading(null);
 }
 };

 const generateSelfReport = async () =>{
  const applicability = {};
  const rowSum = (key, max) =>scoreSectionRows(key, form[key] || [], max, "score");
  const lecScore = scoreSectionRows("lectures", form.lectures || [], 50, "score");
  const cfScore = scoreSectionRows("courseFile", form.courseFile || [], 20, "score");
 const innovScore = clampScore(
 Array.isArray(form.innovRows)
 ? form.innovRows.reduce((t, r) =>t + clampScore(r.score, SCORE_LIMITS.innovativeRow), 0)
 : innovativeTeachingScore(form.innovDetails, form.innovScore, 10),
 10,
 );
  const obeScore = scoreSectionRows("obeRows", form.obeRows || [], 20, "score");
  const mentoringScore = scoreSectionRows("mentoringRows", form.mentoringRows || [], 10, "score");
  const projScore = rowSum("projects", 10);
  const qualScore = rowSum("quals", 10);
  const fbScore = feedbackSectionScore(form.feedback || [], 10);
  const deptScore = rowSum("deptActs", 20);
  const uniScore = rowSum("uniActs", 30);
  const socScore = rowSum("society", 10);
  const acrScore = 0;
  const b1Score = rowSum("journals", 60);
  const b2Score = rowSum("books", 30);
  const b3Score = rowSum("popularWritings", 40);
  const b4Score = rowSum("externalProjects", 20);
  const b5Score = rowSum("research", 20);
  const b6Score = rowSum("consultancy", 30);
  const b7Score = rowSum("confs", 20);
  const b8Score = rowSum("fdps", 20);
  const b9Score = rowSum("awards", 20);
  const b10Score = rowSum("products", 20);
  const b11Score = rowSum("ict", 40);
  const b12Score = rowSum("exhibitions", 30);
  const maxScores = getMediaEffectiveMaxScores(form, { self: true });
  const partATotal = clampScore(lecScore + cfScore + innovScore + obeScore + mentoringScore + projScore + qualScore + fbScore, maxScores.partA);
  const partBTotal = clampScore(b1Score + b2Score + b3Score + b4Score + b5Score + b6Score + b7Score + b8Score + b9Score + b10Score + b11Score + b12Score, maxScores.partB);
  const grandTotal = clampScore(partATotal + partBTotal, maxScores.grand);
 await generateMediaCommReport({
  title: `${schoolCode} Faculty Appraisal Report`,
  subtitle: schoolCode === "SoHSS" ? "School of Humanities and Social Sciences" : "School of Media & Communication Studies",
 form,
 docs,
 partASections: PART_A_SECTIONS.map((section) =>section.key === "acr" ? { ...section, max: 0, title: "(x) Annual Confidential Report (ACR) - Not counted in self score" } : section),
 partBSections: PART_B_SECTIONS,
		totals: { partA: partATotal, partB: partBTotal, total: grandTotal },
		hideAcr: true,
 maxScores,
 generatedBy: sessionStorage.getItem("name") || roleLabel(role),
 declaration,
 reviewChain: reviews.map((rev) =>({
 label: roleLabel(rev.reviewer_role),
 name: rev.reviewer_name || "",
 date: rev.reviewed_at ? new Date(rev.reviewed_at).toLocaleDateString("en-IN") : "",
 })),
 detailedSummaryRows: [
 { isHeader: true, label: "Part A - Teaching Process & Academic Activities" },
 ...summaryRow(applicability, "lectures", { id: "A1", label: "Lectures / Tutorials / Practicals", max: 50, score: lecScore }),
 ...summaryRow(applicability, "courseFile", { id: "A2", label: "Course File", max: 20, score: cfScore }),
 { id: "A3", label: "Innovative Teaching-Learning Methodologies", max: 10, score: innovScore },
 ...summaryRow(applicability, "feedback", { id: "A4", label: "Students' Feedback", max: 10, score: fbScore }),
 { id: "A5", label: "Learning Outcomes Attainment & OBE Practice", max: 20, score: obeScore },
 ...summaryRow(applicability, "projects", { id: "A6", label: "Student Project Guidance", max: 10, score: projScore }),
 { id: "A7", label: "Student Mentoring & Counselling", max: 10, score: mentoringScore },
 ...summaryRow(applicability, "quals", { id: "A8", label: "Qualification Enhancement", max: 10, score: qualScore }),
 { isTotal: true, label: "Part A Total", max: maxScores.partA, score: partATotal },
 { isHeader: true, label: "Part B - Research, Publications & Creative Output" },
 ...summaryRow(applicability, "journals", { id: "B1", label: "Journal Publications / Academic Research Papers", max: 60, score: b1Score }),
 ...summaryRow(applicability, "books", { id: "B2", label: "Books, Book Chapters & Edited Volumes", max: 30, score: b2Score }),
 ...summaryRow(applicability, "popularWritings", { id: "B3", label: "Popular Writing — Newspaper & Magazine Articles, Columns & Reviews", max: 40, score: b3Score }),
 ...summaryRow(applicability, "externalProjects", { id: "B4", label: "Funded Research / Creative Projects & Grants", max: 20, score: b4Score }),
 ...summaryRow(applicability, "research", { id: "B5", label: "Research / Creative Guidance", max: 20, score: b5Score }),
 ...summaryRow(applicability, "consultancy", { id: "B6", label: "Consultancy, Training & Creative Commissions", max: 30, score: b6Score }),
 ...summaryRow(applicability, "confs", { id: "B7", label: "Conference / FDP / Festival Contributions — Organised", max: 20, score: b7Score }),
 ...summaryRow(applicability, "fdps", { id: "B8", label: "Conference / FDP / Industry-Studio Training Attended", max: 20, score: b8Score }),
 ...summaryRow(applicability, "awards", { id: "B9", label: "Research Awards, Fellowships, Reviewer & Citations", max: 20, score: b9Score }),
 ...summaryRow(applicability, "products", { id: "B10", label: "Innovation, Start-ups & Technology Transfer", max: 20, score: b10Score }),
 ...summaryRow(applicability, "ict", { id: "B11", label: "ICT Content, MOOCs & E-Learning", max: 40, score: b11Score }),
 ...summaryRow(applicability, "exhibitions", { id: "B12", label: "Exhibitions — Photography, Documentaries, Films & Audio-Visual", max: 30, score: b12Score }),
 { isTotal: true, label: "Part B Total", max: maxScores.partB, score: partBTotal },
 { isGrandTotal: true, label: "Grand Total (Part A + Part B)", max: maxScores.grand, score: grandTotal },
 ],
 });
 };

  const pendingCount = queue.filter((item) => !isReviewerReviewComplete(item, role)).length;

  const navItems = [
    ...(canSelfSubmit ? [{ id: "myAppraisal", label: "My Appraisal", sub: "View your self-appraisal form" }] : []),
    ...(role !== "faculty" ? [{ id: "approvals", label: `Approvals (${pendingCount})`, sub: "Review faculty appraisals" }] : []),
  ];

  return (
    <DashboardLayout
      appInfo={APP_INFO}
      showLogoutModal={showLogoutModal}
      onCancelLogout={() => setShowLogoutModal(false)}
      containerStyle={{ display: "flex", minHeight: "100vh", fontFamily: "inherit", background: "#f8fafc", color: "#111827" }}
      mainStyle={{ flex: 1, padding: "40px", display: "flex", flexDirection: "column", gap: 16, overflowX: "auto", maxWidth: 1600, margin: "0 auto", width: "100%" }}
      sidebar={(
        <DashboardSidebar
          appInfo={APP_INFO}
          navItems={navItems}
          activeTab={activeTab === "my" ? "myAppraisal" : "approvals"}
          onTabSelect={(tabId) => {
            if (tabId === "myAppraisal") { setActiveTab("my"); setReviewing(null); }
            else { setActiveTab("approvals"); setReviewing(null); }
          }}
          showSectionSelector={activeTab === "my"}
          sectionTab={selfSectionView}
          onSectionChange={handleSelfSectionChange}
          profileSubtitle={`${roleLabel(role)} ${sessionStorage.getItem("department")?.split(" ")[0] || ""}`}
          onLogout={() => setShowLogoutModal(true)}
        />
      )}
    >
      <div style={{ marginBottom: 0, display: "flex", flexDirection: "column", gap: 0 }}>
        <div className="appraisal-page-header" style={{ background: "#fff", borderRadius: 14, padding: "16px 24px", boxShadow: "0 10px 28px rgba(17,24,39,0.06)", border: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <div style={{ minWidth: 260 }}>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#111827", letterSpacing: 0, lineHeight: 1.1 }}>{schoolCode} — My Appraisal Form</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, fontSize: 13, color: "#6b7280", fontWeight: 600, flexWrap: "wrap" }}>
              <span>{form.info?.name || profile.name || sessionStorage.getItem("name") || "Faculty Member"}</span>
              <span>•</span>
              <span>{roleLabel(role)} Workflow Dashboard</span>
              <span>•</span>
              <span>Academic Year:</span>
              <select
                value={academicYear}
                onChange={(event) => handleAcademicYearChange(event.target.value)}
                style={{ height: 32, border: "1px solid #d1d5db", borderRadius: 8, padding: "0 10px", fontSize: 13, fontFamily: "inherit", color: "#374151", background: "#fff", outline: "none", fontWeight: 700 }}
              >
                {academicYearOptions.map((cycle) => (
                  <option key={cycle.academic_year} value={cycle.academic_year}>
                    {cycle.academic_year} {cycle.is_open ? "(Active)" : "(Closed / Read-Only)"}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <AppraisalHeaderImage height={54} />
        </div>
      </div>

  {activeTab === "my" && canSelfSubmit && (
<div style={{ display: "grid", gap: 16 }}>
<div className="appraisal-status-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 316px", gap: 12, alignItems: "stretch" }}>
  <WorkflowTracker declaration={declaration} reviews={reviews} profile={{ ...profile, school: currentSchoolValue, appraisal_role: role }} />
  <div className="appraisal-progress-card" style={{ background: "#fff", borderRadius: 14, padding: "18px 22px", boxShadow: "0 10px 28px rgba(17,24,39,0.06)", border: "1px solid #e5e7eb", display: "flex", flexDirection: "column", justifyContent: "center", gap: 10 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
      <div style={{ fontSize: 14, color: "#374151", fontWeight: 800 }}>Overall Progress</div>
      <div style={{ fontSize: 22, color: "#111827", fontWeight: 950, lineHeight: 1 }}>{Math.round((totals.total / (totals.maxScores?.grand || 700)) * 100)}%</div>
    </div>
    <div style={{ height: 8, borderRadius: 999, background: "#e5e7eb", overflow: "hidden" }}>
      <div style={{ width: `${Math.round((totals.total / (totals.maxScores?.grand || 700)) * 100)}%`, height: "100%", borderRadius: 999, background: "linear-gradient(90deg,#06b6d4,#10b981)", transition: "width 300ms ease" }} />
    </div>
    <div style={{ fontSize: 14, color: "#6b7280", fontWeight: 600 }}>{totals.total.toFixed(1)} / {totals.maxScores?.grand || 700} Marks</div>
  </div>
</div>
<RejectionNotice
 declaration={declaration}
 reviews={reviews}
 form={form}
 status={declaration?.status || form.status}
 alertOnceKey={`${userEmail}:${academicYear}:${declaration?.status || form.status || ""}`}
/>
  {locked && (
    <div style={{ background: workflowRejected ? "#fef2f2" : isSelectedCycleClosed ? "#fbfbfe" : "#ecfdf5", border: `1px solid ${workflowRejected ? "#fecaca" : isSelectedCycleClosed ? "#ddd6fe" : "#bbf7d0"}`, color: workflowRejected ? "#991b1b" : isSelectedCycleClosed ? "#4c1d95" : "#166534", borderRadius: 9, padding: "10px 14px", fontSize: 12, fontWeight: 700 }}>
      {workflowRejected
        ? "This appraisal was rejected. Review the approval status in the tracker above."
        : isSelectedCycleClosed
          ? `This appraisal form for Academic Year ${academicYear} is closed for editing and displayed in Read-Only mode.`
          : "Submitted and locked for review. Your saved data is visible here, but editing is disabled while authorities review it."}
    </div>
  )}

  {isSelectedCycleClosed ? (
    <div className="fa-section-card appraisal-section-card" style={{ background: "#fff", borderRadius: 14, boxShadow: "0 18px 50px rgba(17,24,39,0.08)", padding: 24, border: "1px solid #e5e7eb", borderTop: "3px solid #4c1d95" }}>
      <div style={{ fontWeight: 800, fontSize: 18, color: "#4c1d95", marginBottom: 16 }}>Closed Appraisal Report — {academicYear}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        {[
          ["Academic Year", academicYear],
          ["Submitted Score", `${totals.total.toFixed(1)} / ${totals.maxScores?.grand || 700}`],
          ["Documents", `${Object.keys(docs).length} file${Object.keys(docs).length === 1 ? "" : "s"}`],
        ].map(([label, value]) => (
          <div key={label} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "12px 14px", background: "#f8fafc" }}>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 900, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
            <div style={{ marginTop: 5, fontSize: 16, color: "#111827", fontWeight: 900 }}>{value}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "center", marginTop: 20 }}>
        <button
          type="button"
          onClick={handleGenerateReport}
          style={{ padding: "10px 28px", background: "#4c1d95", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 14, fontFamily: "inherit" }}
        >
          Generate Report
        </button>
      </div>
      <div style={{ marginTop: 22, borderTop: "1px solid #e5e7eb", paddingTop: 18 }}>
        <div style={{ fontSize: 14, color: "#374151", fontWeight: 900, marginBottom: 12 }}>Attachments</div>
        {Object.keys(docs).length ? (
          <div style={{ display: "grid", gap: 10 }}>
            {Object.keys(docs).map((key) => (
              <div key={key} style={{ display: "grid", gridTemplateColumns: "minmax(120px, 180px) minmax(0, 1fr)", alignItems: "center", gap: 12, border: "1px solid #e5e7eb", borderRadius: 10, padding: "10px 12px", background: "#fff" }}>
                <div style={{ fontSize: 12, color: "#475569", fontWeight: 800 }}>{key}</div>
                <ViewDocsCell docKey={key} docs={docs} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, padding: "12px 14px", border: "1px solid #e5e7eb", borderRadius: 10, background: "#f8fafc" }}>No attachments found for this closed appraisal year.</div>
        )}
      </div>
    </div>
  ) : (<>
 {(selfSectionView === "partA" || selfSectionView === "partB" || selfSectionView === "partC" || selfSectionView === "partD") && (
<>
<MediaForm
 form={form}
 setForm={setForm}
 docs={docs}
 setDocs={setDocs}
 mode="self"
 locked={locked}
 sectionView={selfSectionView}
/>
<SectionSaveFooter
 savingSection={savingSection}
 onSaveSection={handleSaveSelfSection}
 showNext={selfSectionView !== "partD"}
 onNext={() =>{
  if (selfSectionView === "partA") setSelfSectionView("partB");
  else if (selfSectionView === "partB") setSelfSectionView("partC");
  else if (selfSectionView === "partC") setSelfSectionView("partD");
  else if (selfSectionView === "partD") setSelfSectionView("summary");
 }}
 disabled={locked}
/>
</>
 )}
 {selfSectionView === "summary" && (
<div style={{ display: "grid", gap: 16 }}>
<div className="fa-section-card appraisal-section-card" style={{ background: "#fff", borderRadius: 14, boxShadow: "0 18px 50px rgba(17,24,39,0.08)", overflow: "hidden", border: "1px solid #e5e7eb", borderTop: "3px solid #10b981" }}>
  <div className="appraisal-part-header" style={{ padding: "18px 24px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, background: "linear-gradient(180deg,#ffffff 0%,#fbfffd 100%)" }}>
    <div style={{ minWidth: 0, display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ width: 36, height: 36, borderRadius: 12, background: "#10b98114", color: "#10b981", border: "1px solid #10b9812e", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <InlineSvgIcon paths={SUMMARY_ICONS.cap} size={19} />
      </span>
      <div style={{ fontWeight: 900, fontSize: 18, color: "#10b981", letterSpacing: 0 }}>Appraisal Summary & Submission</div>
    </div>
  </div>
  <div style={{ padding: "24px 28px 28px", display: "grid", gap: 20 }}>
    <table className="appraisal-summary-table" style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, marginBottom: 0, border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden", boxShadow: "0 12px 26px rgba(15,23,42,0.04)" }}>
      <tbody>
        <SummaryRow label="Part A - Teaching & Learning" score={totals.partA} max={totals.maxScores?.partA || 150} color="#4f46e5" tone="#eef2ff" iconTone="#eef2ff" icon="book" />
        <SummaryRow label="Part B - Research & Innovation" score={totals.partB} max={totals.maxScores?.partB || 350} color="#7c3aed" tone="#f3e8ff" iconTone="#f5f3ff" icon="flask" />
        <SummaryRow label="Part C - Administrative Contribution" score={totals.partC} max={totals.maxScores?.partC || 150} color="#0f766e" tone="#ccfbf1" iconTone="#ccfbf1" icon="building" />
        <SummaryRow label="Part D - Annual Confidential Report" score={totals.partD} max={totals.maxScores?.partD || 50} color="#c2410c" tone="#ffedd5" iconTone="#ffedd5" icon="document" />
        <SummaryRow label="Grand Total" score={totals.total} max={totals.maxScores?.grand || 700} color="#e11d48" tone="#ffe4e6" iconTone="#f1f5f9" icon="sigma" />
      </tbody>
    </table>
<SummaryOtherInfoField
 value={form.summaryOtherInfo}
 onChange={(value) =>setForm((prev) =>({ ...prev, summaryOtherInfo: value }))}
 readOnly={locked}
 rows={5}
/>
  {locked ?<StatusBadge status={declaration?.status || "Submitted"} />: (
<>
<AccuracyCheckbox checked={confirmed} onChange={setConfirmed} />
<label className={attachmentsConfirmed ? "appraisal-declaration-card is-checked" : "appraisal-declaration-card"} style={{ display: "flex", gap: 14, alignItems: "flex-start", fontSize: 13, color: "#334155", lineHeight: 1.5, padding: "14px 18px", background: attachmentsConfirmed ? "#dcfce7" : "#ecfdf5", border: `1px solid ${attachmentsConfirmed ? "#86efac" : "#bbf7d0"}`, borderRadius: 12, cursor: "pointer", transition: "background 180ms ease, border-color 180ms ease, box-shadow 180ms ease", boxShadow: attachmentsConfirmed ? "0 10px 24px rgba(16,185,129,0.10)" : "none" }}>
<input type="checkbox" checked={attachmentsConfirmed} onChange={(e) =>setAttachmentsConfirmed(e.target.checked)} style={{ marginTop: 2, width: 18, height: 18, accentColor: "#10b981", flexShrink: 0 }} />
<span>I confirm that <strong>all required supporting documents and attachments have been uploaded</strong> against the respective entries. I understand that any <strong>missing or false attachment is my sole responsibility</strong> and may result in the rejection or revision of my appraisal.</span>
</label>
</>
 )}
<div className="appraisal-summary-actions" style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
<button type="button" onClick={generateSelfReport} className="appraisal-report-button" style={{ minWidth: 172, minHeight: 42, padding: "10px 24px", background: "linear-gradient(180deg,#6d28d9 0%,#4c1d95 100%)", color: "#fff", border: "none", borderRadius: 9, cursor: "pointer", fontWeight: 800, fontSize: 13, fontFamily: "inherit", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 9, boxShadow: "0 10px 20px rgba(76,29,149,0.22)" }}>
 <InlineSvgIcon paths={SUMMARY_ICONS.report} size={16} />
 Generate Report
</button>
<button type="button" onClick={handleSubmitAppraisal} disabled={submitting || locked || !confirmed || !attachmentsConfirmed} className="appraisal-submit-button" style={{ minWidth: 172, minHeight: 42, padding: "10px 24px", background: (locked || !confirmed || !attachmentsConfirmed) ? "#64748b" : "linear-gradient(180deg,#334155 0%,#1e293b 100%)", color: "#fff", border: "none", borderRadius: 9, cursor: (locked || !confirmed || !attachmentsConfirmed) ? "not-allowed" : "pointer", fontWeight: 800, fontSize: 13, fontFamily: "inherit", opacity: submitting ? 0.76 : 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 9, boxShadow: (locked || !confirmed || !attachmentsConfirmed) ? "none" : "0 10px 20px rgba(30,41,59,0.18)" }}>
 {submitting ? <span className="appraisal-button-spinner" aria-hidden="true" /> : <InlineSvgIcon paths={SUMMARY_ICONS.send} size={16} />}
 {locked ? "Submitted & Locked" : submitting ? "Submitting..." : "Submit Appraisal"}
</button>
</div>
  </div>
</div>
        </div>
      )}
    </>
  )}
</div>
  )}

 {activeTab === "approvals" && !reviewing && role !== "faculty" && (
<div>
 {/* - Queue header & live stats - */}
 {!loadingQueue && queue.length >0 && (
<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
<div>
<div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>Faculty Approvals Queue</div>
<div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Review and grade submitted appraisals</div>
</div>
<div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
<span style={{ background: "#f1f5f9", color: "#475569", padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>Total: {queue.length}</span>
<span style={{ background: "#fef9c3", color: "#854d0e", padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>Pending: {queue.filter(i =>!isReviewerReviewComplete(i, role)).length}</span>
<span style={{ background: "#dcfce7", color: "#166534", padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>Reviewed: {queue.filter(i =>isReviewerReviewComplete(i, role)).length}</span>
</div>
</div>
 )}

 {/* - Loading indicator - */}
 {loadingQueue && (
<div style={{ display: "flex", alignItems: "center", gap: 10, padding: "24px 0", color: "#64748b", fontSize: 13 }}>
<div className="fa-pulse" style={{ width: 8, height: 8, borderRadius: "50%", background: ACCENT }} />
  Loading {schoolCode} queue...
</div>
 )}

 {/* - Empty state - */}
 {!loadingQueue && queue.length === 0 && (
<div style={{ textAlign: "center", padding: "56px 24px", background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0" }}>
<div style={{ width: 52, height: 52, borderRadius: "50%", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", fontSize: 24 }}>Done</div>
<div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a", marginBottom: 6 }}>All caught up!</div>
<div style={{ color: "#64748b", fontSize: 13 }}>No {schoolCode} submissions are assigned to you at this time.</div>
</div>
 )}

 {/* - Faculty cards - */}
<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
 {queue.map((item) =>{
 const initials = (item.name || "?").trim().split(/\s+/).map(w =>w[0]).join("").substring(0, 2).toUpperCase();
 const mergedItem = mergeForm(emptyMediaForm(), item);
 const facultyTotals = calculateMediaTotals(mergedItem, "score");
 const reviewerTotals = calculateMediaTotals(mergedItem, role);
 const hasReviewerScores = reviewerTotals.partA >0 || reviewerTotals.partB >0 || reviewerTotals.total >0;
 const pendingForRole = isPendingReviewStatusFor([item.status, item.workflowStatus, item.workflow_status], role);
 const reviewComplete = !pendingForRole && (isReviewerReviewComplete(item, role) || hasReviewerScores);
 const maxScores = {
 partA: n(item.effectivePartAMax) || facultyTotals.maxScores.partA,
 partB: n(item.effectivePartBMax) || facultyTotals.maxScores.partB,
 grand: n(item.effectiveGrandMax) || facultyTotals.maxScores.grand,
 };
 const itemTotals = {
 partA: n(item.selfPartA ?? item.partATotal),
 partB: n(item.selfPartB ?? item.partBTotal),
 total: n(item.selfTotal ?? item.grandTotal),
 };
 const scoreLabel = `Submitted on ${item.submittedOn || "record"}`;
 return (
<div key={item.id} style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", borderLeft: `4px solid ${reviewComplete ? "#22c55e" : ACCENT}`, overflow: "hidden" }}>
 {/* - Name / role / action row - */}
<div style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
<div style={{ width: 42, height: 42, borderRadius: "50%", background: `linear-gradient(135deg,${ACCENT},${ACCENT2})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 13, flexShrink: 0, letterSpacing: 0.5 }}>{initials}</div>
<div style={{ flex: 1, minWidth: 0 }}>
<div style={{ fontWeight: 800, fontSize: 14, color: "#0f172a", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
<div style={{ fontSize: 12, color: "#64748b" }}>{titleCase(item.appraisalRole)} - {item.school}</div>
</div>
<div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
<StatusBadge status={item.status} />
<button
 disabled={reviewLoading === item.id}
 onClick={() =>openSubmittedReview(item)}
 style={{ ...smallButton(reviewComplete ? "#1e293b" : ACCENT2), padding: "6px 14px", fontSize: 11, cursor: reviewLoading === item.id ? "wait" : "pointer", opacity: reviewLoading === item.id ? 0.7 : 1 }}
 >
 {reviewLoading === item.id ? "Loading..." : reviewComplete ? "View Review" : "Review Form"}
</button>
</div>
</div>
 {/* - Score metrics grid - */}
<div style={{ padding: "12px 18px 14px", background: "#fafbff", borderTop: "1px solid #f1f5f9" }}>
<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px 20px", marginBottom: 8 }}>
 {[["Part A", itemTotals.partA, maxScores.partA, ACCENT], ["Part B", itemTotals.partB, maxScores.partB, ACCENT2], ["Grand Total", itemTotals.total, maxScores.grand, "#059669"]].map(([label, value, max, color]) =>(
<div key={label}>
<div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
<span style={{ fontWeight: 600, color: "#475569" }}>{label}</span>
<span style={{ fontWeight: 700, color }}>{n(value).toFixed(1)}<span style={{ color: "#94a3b8", fontWeight: 500 }}>/{max}</span></span>
</div>
<div style={{ height: 5, background: "#e2e8f0", borderRadius: 99, overflow: "hidden" }}>
<div style={{ height: "100%", width: `${Math.min(100, max >0 ? (n(value) / max) * 100 : 0)}%`, background: color, borderRadius: 99, transition: "width 0.6s ease" }} />
</div>
</div>
 ))}
</div>
<div style={{ fontSize: 10, color: "#94a3b8", textAlign: "right" }}>{scoreLabel}</div>
</div>
</div>
 );
 })}
</div>
</div>
 )}

  {activeTab === "approvals" && reviewing && (
<MediaCommAuthorityReviewPanel
 person={reviewing}
 reviewerRole={role}
 onBack={() =>setReviewing(null)}
 onSubmit={handleSubmitReview}
 readOnly={isReviewerReviewComplete(reviewing, role)}
/>
  )}
    </DashboardLayout>
  );
}

const thStyle = { border: "1px solid #334155", padding: "7px 8px", background: "#1e293b", color: "#e2e8f0", fontWeight: 800, textAlign: "center", fontSize: 10, whiteSpace: "nowrap", letterSpacing: "0.3px" };
const tdStyle = { border: "1px solid #e2e8f0", padding: "5px 7px", verticalAlign: "middle", minWidth: 120 };
const tdCenter = { ...tdStyle, textAlign: "center", minWidth: 70 };
const smallButton = (background) =>({ padding: "8px 14px", background, color: "#fff", border: "none", borderRadius: 7, cursor: background === "#94a3b8" ? "not-allowed" : "pointer", fontWeight: 800, fontSize: 12, fontFamily: "inherit" });
const navButton = (active) =>({ width: "100%", border: "none", borderLeft: `3px solid ${active ? ACCENT : "transparent"}`, background: active ? `${ACCENT}33` : "transparent", color: active ? "#fbbf24" : "#cbd5e1", borderRadius: 8, padding: "10px 12px", cursor: "pointer", textAlign: "left", fontWeight: 800, fontFamily: "inherit" });





