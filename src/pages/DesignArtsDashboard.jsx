/* eslint-disable no-unused-vars, react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getActiveAcademicYear, getSessionItem, setActiveAcademicYear } from "../auth/session";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import { Avatar, LogoutConfirmModal, ScoreBar, StatusBadge, ReviewMetricsStrip } from "../components/dashboard/dashboardPrimitives";
import { getSchoolByValue, getSchoolKey } from "../constants/universityHierarchy";
import { api } from "../services/api";
import {
 canEditSelfAppraisal,
 canSaveDraft,
 canSubmitAppraisal,
 appraisalWindowMessage,
 appraisalWindowErrorMessage,
 getAppraisalWindowStatus,
} from "../services/appraisalWindowService";
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
 RowButtons as RowBtns,
} from "../features/faculty-appraisal";
import { canReviewerRejectProfile, getReviewChain, pendingStatusFor, profileFromsessionStorage, reviewedStatusFor, roleLabel, visiblePreviousReviewRoles, workflowValidationError, isAppraisalFinalisedByVc, isRejectedStatus, isPendingReviewStatusFor, hasActiveRejection, reviewListFrom } from "../utils/hierarchy";
import { n, pct, RO, TI } from "../features/faculty-appraisal/shared";

import { emptyDesignArtsForm, ALL_ARRAY_KEYS, titleCase, calculateDesignArtsTotals, getDesignArtsEffectiveMaxScores, validateDesignArtsBeforeSubmit, mergeForm, preserveSavedReviewScores, designArtsSchoolName, PART_A_SECTIONS, PART_B_SECTIONS, PART_C_SECTIONS, PART_D_SECTIONS, PART_E_SECTIONS, DesignArtsForm, DesignArtsAuthorityReviewPanel, SectionSelector, AccuracyCheckbox, CompactAuthoritySummaryCard, isReviewerReviewComplete, normalizeScoresForSubmit, summaryRow, b8summaryRow, SECTION_OPTIONS, SummaryBox, WorkflowTracker, ACCENT, ACCENT2, PART_A_MAX, PART_B_MAX, PART_D_MAX, PART_E_MAX, GRAND_MAX, userInitials } from "../features/faculty-appraisal";
import { loadClosedAppraisal } from "../services/appraisalPersistence";
import { DesignArtsPreviousYearView } from "../features/previousYearReport";
import { isLegacyTwoPartAcademicYear } from "../features/faculty-appraisal/forms/standard/legacyPreviousYearReportUtils";
import { legacyDashboardMetrics } from "../utils/legacyDashboardMetrics";

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
         <span style={{ color: "#1f2937", fontSize: 13, fontWeight: 800, lineHeight: 1.35 }}>{label}</span>
       </div>
     </td>
     <td style={{ width: 150, padding: "10px 12px", border: 0, textAlign: "right", verticalAlign: "middle" }}>
       <ScoreBadge score={score} max={max} color={color} tone={tone} />
     </td>
   </tr>
 );
}

function normalizeAcademicYearCycles(cyclesData) {
  const normalizeAcademicYearLabel = (value) => {
    const label = String(value || "").trim();
    const shortMatch = label.match(/^(\d{2})-(\d{2})$/);
    if (shortMatch) return `20${shortMatch[1]}-20${shortMatch[2]}`;
    return label;
  };

  const normalizeCycle = (cycle) => {
    if (!cycle) return null;
    if (typeof cycle === "string") {
      return { academic_year: cycle, is_open: cycle === APP_INFO.DEFAULT_AY };
    }
    const academicYear = normalizeAcademicYearLabel(cycle.academic_year || cycle.academicYear || cycle.year || cycle.year_label || "");
    if (!academicYear) return null;
    return {
      academic_year: academicYear,
      is_open: cycle.is_open ?? cycle.isOpen ?? cycle.active ?? cycle.open ?? (String(academicYear) === APP_INFO.DEFAULT_AY),
    };
  };

  let list = [];
  if (Array.isArray(cyclesData)) {
    list = cyclesData.map(normalizeCycle).filter(Boolean);
  } else if (Array.isArray(cyclesData?.cycles)) {
    list = cyclesData.cycles.map(normalizeCycle).filter(Boolean);
  } else if (Array.isArray(cyclesData?.data)) {
    list = cyclesData.data.map(normalizeCycle).filter(Boolean);
  }

  if (list.length === 0) {
    const openYear = APP_INFO.DEFAULT_AY || "2026-2027";
    list.push({ academic_year: openYear, is_open: true });
  }

  return list
    .reduce((acc, cycle) => {
      if (!acc.some((existing) => existing.academic_year === cycle.academic_year)) {
        acc.push(cycle);
      }
      return acc;
    }, [])
    .sort((a, b) => b.academic_year.localeCompare(a.academic_year));
}

const storedAcademicYearCycles = () =>
  getSessionItem("availableCyclesSource") === "backend"
    ? JSON.parse(getSessionItem("availableCycles") || "[]")
    : [];

export default function DesignArtsDashboard({ fixedRole }) {
 const navigate = useNavigate();
 const role = fixedRole || sessionStorage.getItem("role") || "faculty";
 const profile = profileFromsessionStorage();
 const [activeTab, setActiveTab] = useState(role === "faculty" ? "my" : "approvals");
 const [selfSectionView, setSelfSectionView] = useState("partA");
 const [form, setForm] = useState(emptyDesignArtsForm);
 const [docs, setDocs] = useState({});
 const [queue, setQueue] = useState([]);
 const [reviewing, setReviewing] = useState(null);
 const [loadingQueue, setLoadingQueue] = useState(false);
 const [reviewLoading, setReviewLoading] = useState(null);
 const [filterStatus, setFilterStatus] = useState("All");
 const [submitting, setSubmitting] = useState(false);
 const [confirmed, setConfirmed] = useState(false);
 const [attachmentsConfirmed, setAttachmentsConfirmed] = useState(false);

 const [showLogoutModal, setShowLogoutModal] = useState(false);
 const [sectionSaveStatus, setSectionSaveStatus] = useState({ partA: false, partB: false, partC: false, partD: false, partE: false });
 const [savingSection, setSavingSection] = useState(null);
 const [declaration, setDeclaration] = useState(null);
 const [reviews, setReviews] = useState([]);
 const [availableCycles, setAvailableCycles] = useState(() => normalizeAcademicYearCycles(storedAcademicYearCycles()));
 const [previousYearResponse, setPreviousYearResponse] = useState(null);
 const [appraisalWindowStatus, setAppraisalWindowStatus] = useState(null);
 const [appraisalWindowError, setAppraisalWindowError] = useState("");
 const [loadingYearData, setLoadingYearData] = useState(false);
 const yearLoadRequestRef = useRef(0);
 const userEmail = sessionStorage.getItem("username") || sessionStorage.getItem("email") || localStorage.getItem("username") || localStorage.getItem("email") || "";
 const academicYear = form.info?.ay || getActiveAcademicYear();

 useEffect(() => {
    const syncAvailableCycles = () => {
      setAvailableCycles(normalizeAcademicYearCycles(storedAcademicYearCycles()));
    };
    syncAvailableCycles();
    window.addEventListener("academicYearChanged", syncAvailableCycles);
    return () => window.removeEventListener("academicYearChanged", syncAvailableCycles);
  }, []);

  const academicYearOptions = availableCycles.length > 0
    ? availableCycles
    : [{ academic_year: academicYear || APP_INFO.DEFAULT_AY, is_open: true }];

  useEffect(() =>{
    let active = true;
    setAppraisalWindowStatus(null);
    setAppraisalWindowError("");
    if (!academicYear) {
      setAppraisalWindowError("Please select an academic year.");
      return undefined;
    }
    getAppraisalWindowStatus({ academicYear })
      .then((status) =>{
        if (!active) return;
        setAppraisalWindowStatus(status);
      })
      .catch((err) =>{
        if (!active) return;
        setAppraisalWindowError(appraisalWindowErrorMessage(err));
      });
    return () =>{
      active = false;
    };
  }, [academicYear]);

  const selectedCycle = academicYearOptions.find((c) => c.academic_year === academicYear);
  const isSelectedCycleClosed = selectedCycle ? !selectedCycle.is_open : false;
  const isSelectedCycleOpen = selectedCycle ? Boolean(selectedCycle.is_open) : false;
  const isLegacyTwoPartYear = isLegacyTwoPartAcademicYear(academicYear);
  const workflowRejected = hasActiveRejection(declaration, reviews);
  const appraisalWindowLocked = !isSelectedCycleOpen && !canEditSelfAppraisal(appraisalWindowStatus, { declaration });
  const locked = appraisalWindowLocked || isSelectedCycleClosed || (Boolean(declaration) && !workflowRejected);
  const closedAppraisalCycleMessage = `Appraisal cycle for Academic Year ${academicYear} is closed. The next appraisal cycle form will be available soon. For any queries, please contact appraisal@dypiu.ac.in.`;
  const appraisalWindowLockMessage = isSelectedCycleOpen || isSelectedCycleClosed ? "" : appraisalWindowError || (appraisalWindowLocked ? appraisalWindowMessage(appraisalWindowStatus, academicYear) : "");
  const totals = calculateDesignArtsTotals(form, "score");
  const partWiseProgressRows = [
    ["Part A", totals.partA, totals.maxScores?.partA || 0],
    ["Part B", totals.partB, totals.maxScores?.partB || 0],
    ["Part C", totals.partC, totals.maxScores?.partC || 0],
    ["Part D", totals.partD, totals.maxScores?.partD || 0],
  ];
  const canSelfSubmit = role !== "vc";
  const currentSchoolValue = form.info?.school || profile.school || sessionStorage.getItem("school") || sessionStorage.getItem("schoolName") || "";
  const schoolDisplayName = designArtsSchoolName(
    profile,
    sessionStorage.getItem("school"),
    sessionStorage.getItem("schoolName"),
    form,
  );

  const handleAcademicYearChange = (newAy) => {
    setForm((prev) => ({ ...prev, info: { ...prev.info, ay: newAy } }));
    setActiveAcademicYear(newAy);
    window.dispatchEvent(new CustomEvent("academicYearChanged", { detail: { academicYear: newAy } }));
  };

  const handleGenerateReport = () => {
    openFullFormReport({
      title: `${schoolDisplayName} — Faculty Appraisal Report`,
      subtitle: `Academic Year: ${academicYear}`,
      form,
      docs,
      partASections: PART_A_SECTIONS,
      partBSections: PART_B_SECTIONS,
      partCSections: PART_C_SECTIONS,
      partDSections: PART_D_SECTIONS,
      totals,
      maxScores: totals.maxScores,
      scoreRoles: ["score"],
      roleLabel,
      declaration,
      hideAcr: true,
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
  ["setDocs", setDocs],
  ["setSummaryOtherInfo", (value) =>setForm((prev) =>({ ...prev, summaryOtherInfo: value }))],
  ["setSectionSaveStatus", (value) =>setSectionSaveStatus((prev) =>({ ...prev, ...(value || {}) }))],
  ]), [setForm, setSectionSaveStatus, setDocs]);

 useEffect(() =>{
 if (isLegacyTwoPartYear && !["partA", "partB"].includes(selfSectionView)) {
 setSelfSectionView("partA");
 }
 }, [isLegacyTwoPartYear, selfSectionView]);

 useEffect(() =>{
 if (!userEmail || !academicYear || !canSelfSubmit) return;
 const requestId = ++yearLoadRequestRef.current;
 const isCurrentLoad = () =>yearLoadRequestRef.current === requestId;
 setDocs({});
 setPreviousYearResponse(null);
 setLoadingYearData(true);
 const loadAll = async () =>{
 try {
 const data = await api.get("/appraisal/status", { params: { academic_year: academicYear } }).catch((err) =>{
 console.error("Could not load workflow status:", err);
 return null;
 });
 if (!isCurrentLoad()) return;
 const declarationRow = data?.declaration || null;
 const loadedReviews = reviewListFrom(data?.reviews);
 setDeclaration(declarationRow);
 setReviews(loadedReviews);
 const preferSubmitted = Boolean(declarationRow) && hasActiveRejection(declarationRow, loadedReviews);
 const loadAppraisal = isLegacyTwoPartYear
 ? fetchSavedAppraisal({ facultyEmail: userEmail, academicYear })
 : (isSelectedCycleClosed ? loadClosedAppraisal : loadSavedAppraisal)({ facultyEmail: userEmail, academicYear, setters, preferSubmitted });
 const [loadedAppraisal] = await Promise.all([
 loadAppraisal,
 loadAppraisalDocuments({ facultyEmail: userEmail, academicYear, setDocs }),
 ]);
 if (!isCurrentLoad()) return;
 setPreviousYearResponse(loadedAppraisal || null);
 } finally {
 if (isCurrentLoad()) setLoadingYearData(false);
 }
 };
 loadAll().catch((err) =>console.error(`Could not load ${schoolDisplayName} appraisal:`, err));
 }, [userEmail, academicYear, setters, canSelfSubmit, isSelectedCycleClosed, isLegacyTwoPartYear]);

 const loadQueue = async () =>{
 if (role === "faculty") return;
 setLoadingQueue(true);
 try {
 const items = await fetchReviewQueueForRole({
 reviewerRole: role,
 reviewerProfile: { ...profile, appraisal_role: role },
 schoolValues: FORM_SCHOOL_CODES[FORM_TYPES.DESIGN_ARTS],
 });
 setQueue(items.filter((item) =>FORM_SCHOOL_CODES[FORM_TYPES.DESIGN_ARTS].includes(getSchoolKey(item.school || item.info?.school))));
 } catch (err) {
 console.error(`Could not load ${schoolDisplayName} review queue:`, err);
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

 const autoSaveReadyRef = useRef(false);
 const autoSaveInFlightRef = useRef(false);
 const queuedAutoSaveRef = useRef(null);
 const lastAutoSavedFingerprintRef = useRef("");

 useEffect(() =>{
 if (!autoSaveReadyRef.current) {
 autoSaveReadyRef.current = true;
 return undefined;
 }
 if (!userEmail || !academicYear || locked || submitting || isLegacyTwoPartYear) return undefined;

 const formToSave = {
 ...form,
 info: { ...form.info, school: currentSchoolValue },
 sectionSaveStatus,
 };
 const totalsToSave = {
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
 };
 const fingerprint = JSON.stringify({ form: formToSave, docs, totals: totalsToSave });
 if (fingerprint === lastAutoSavedFingerprintRef.current) return undefined;

 const payload = {
 fingerprint,
 facultyEmail: userEmail,
 academicYear,
 form: formToSave,
 docs,
 totals: totalsToSave,
 submitterProfile: { ...profile, school: currentSchoolValue, appraisal_role: role },
 sectionSaveStatus,
 };

 const runAutoSave = async (snapshot) =>{
 if (autoSaveInFlightRef.current) {
 queuedAutoSaveRef.current = snapshot;
 return;
 }
 autoSaveInFlightRef.current = true;
 try {
 await saveAppraisalDraftSection(snapshot);
 lastAutoSavedFingerprintRef.current = snapshot.fingerprint;
 } catch (err) {
 if (err?.statusCode === 403 || err?.response?.status === 403) {
 setDeclaration((current) =>current || { status: "Submitted" });
 } else {
 console.warn("Auto-save failed:", err);
 }
 } finally {
 autoSaveInFlightRef.current = false;
 const queuedSnapshot = queuedAutoSaveRef.current;
 queuedAutoSaveRef.current = null;
 if (queuedSnapshot && queuedSnapshot.fingerprint !== lastAutoSavedFingerprintRef.current) {
 window.setTimeout(() =>runAutoSave(queuedSnapshot), 0);
 }
 }
 };

 const timer = window.setTimeout(() =>{
 runAutoSave(payload);
 }, 1800);

 return () =>window.clearTimeout(timer);
 }, [form, docs, sectionSaveStatus, userEmail, academicYear, locked, submitting, isLegacyTwoPartYear, totals, profile, currentSchoolValue, role]);

 const handleSaveSelfSection = async (section) =>{
 if (locked) return;
 if (!userEmail) {
 alert("Please login again before saving. Your session email was not found.");
 navigate("/login", { replace: true });
 return;
 }
 if (!isSelectedCycleOpen) {
 let latestWindowStatus;
 try {
 latestWindowStatus = await getAppraisalWindowStatus({ academicYear });
 setAppraisalWindowStatus(latestWindowStatus);
 setAppraisalWindowError("");
 } catch (err) {
 const message = appraisalWindowErrorMessage(err);
 setAppraisalWindowError(message);
 alert(message);
 return;
 }
 if (!canSaveDraft(latestWindowStatus)) {
 alert("Draft saving is disabled because appraisal submission is closed.");
 return;
 }
 }
 const nextStatus = { ...sectionSaveStatus, [section]: true };
 const formToSave = {
 ...form,
 info: { ...form.info, school: currentSchoolValue },
 sectionSaveStatus: nextStatus,
 };
 setSavingSection(section);
 try {
 await saveAppraisalDraftSection({
 facultyEmail: userEmail,
 academicYear,
 form: formToSave,
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
 submitterProfile: { ...profile, school: currentSchoolValue, appraisal_role: role },
 sectionSaveStatus: nextStatus,
 });
 setSectionSaveStatus(nextStatus);
 const NEXT_SECTION_MAP = { partA: "partB", partB: "partC", partC: "partD", partD: "partE", partE: "summary" };
 const nextSection = NEXT_SECTION_MAP[section];
 if (nextSection) {
   setSelfSectionView(nextSection);
   requestAnimationFrame(() => {
     window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
   });
 }
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
 if (!isSelectedCycleOpen) {
 let latestWindowStatus;
 try {
 latestWindowStatus = await getAppraisalWindowStatus({ academicYear });
 setAppraisalWindowStatus(latestWindowStatus);
 setAppraisalWindowError("");
 } catch (err) {
 const message = appraisalWindowErrorMessage(err);
 setAppraisalWindowError(message);
 alert(message);
 return;
 }
 if (!canSubmitAppraisal(latestWindowStatus)) {
 alert("Appraisal submission is closed for this academic year.");
 return;
 }
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
 const submitterProfile = { ...profile, school: currentSchoolValue, appraisal_role: role };
 const workflowError = workflowValidationError(submitterProfile);
 if (workflowError) {
 alert(workflowError);
 return;
 }
 const normalizedForm = normalizeScoresForSubmit({
 ...form,
 info: { ...form.info, school: currentSchoolValue },
 });
 const validationErrors = validateDesignArtsBeforeSubmit(normalizedForm, docs);
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
 setDeclaration({ status: pendingStatusFor(getReviewChain(submitterProfile)[0]), submitted_at: submittedAt, updated_at: submittedAt });
 setReviews([]);
 alert(`${schoolDisplayName} appraisal submitted successfully.`);
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

 const generateSelfReport = () =>{
 const applicability = {};
 const rowSum = (key, max) =>scoreSectionRows(key, form[key] || [], max, "score", key === "research" ? { autoFillResearchScore: false } : undefined);
 const lecScore = scoreSectionRows("lectures", form.lectures || [], 40, "score");
 const cfScore = scoreSectionRows("courseFile", form.courseFile || [], 20, "score");
 const innovScore = clampScore(Array.isArray(form.innovRows) ? form.innovRows.reduce((t, r) =>t + clampScore(r.score, r.max || 4), 0) : innovativeTeachingScore(form.innovDetails, form.innovScore, 10), 10);
 const obeScore = scoreSectionRows("obeRows", form.obeRows || [], 20, "score");
 const mentoringScore = scoreSectionRows("mentoringRows", form.mentoringRows || [], 10, "score");
 const maxScores = getDesignArtsEffectiveMaxScores(form, { self: true });
 const b8Score = rowSum("fdps", 20);
 const partATotal = clampScore(lecScore + cfScore + innovScore + obeScore + mentoringScore + rowSum("projects", 20) + rowSum("quals", 10) + feedbackSectionScore(form.feedback || [], 10), maxScores.partA);
 const partBTotal = clampScore(
    rowSum("journals", 60) +
    rowSum("books", 30) +
    rowSum("ipr", 40) +
    rowSum("externalProjects", 20) +
    rowSum("research", 20) +
    rowSum("consultancy", 30) +
    rowSum("confs", 20) +
    b8Score +
    rowSum("awards", 20) +
    rowSum("innovation", 20) +
    rowSum("ict", 40) +
    rowSum("exhibitions", 30),
    maxScores.partB
  );
  const partCTotal = totals.partC;
  const partDTotal = totals.partD;
  const grandTotal = clampScore(partATotal + partBTotal + partCTotal + partDTotal, maxScores.grand);
  generateMediaCommReport({
  title: `${schoolDisplayName} Appraisal Report`,
  subtitle: `${roleLabel(role)} appraisal form`,
  form,
  docs,
  partASections: PART_A_SECTIONS,
  partBSections: PART_B_SECTIONS,
  partCSections: PART_C_SECTIONS,
  partDSections: PART_D_SECTIONS,
  totals: { partA: partATotal, partB: partBTotal, partC: partCTotal, partD: partDTotal, total: grandTotal },
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
  ...summaryRow(applicability, "lectures", { id: "A1", label: "Lectures / Tutorials / Practicals", max: 40, score: lecScore }),
  ...summaryRow(applicability, "courseFile", { id: "A2", label: "Course File", max: 20, score: cfScore }),
  { id: "A3", label: "Innovative Teaching-Learning Methodologies", max: 10, score: innovScore },
  ...summaryRow(applicability, "feedback", { id: "A4", label: "Students' Feedback", max: 10, score: feedbackSectionScore(form.feedback || [], 10) }),
  { id: "A5", label: "Learning Outcomes Attainment & OBE Practice", max: 20, score: obeScore },
  ...summaryRow(applicability, "projects", { id: "A6", label: "Student Project Guidance", max: 20, score: rowSum("projects", 20) }),
  { id: "A7", label: "Student Mentoring & Counselling", max: 10, score: mentoringScore },
  ...summaryRow(applicability, "quals", { id: "A8", label: "Qualification Enhancement", max: 10, score: rowSum("quals", 10) }),
  { isTotal: true, label: "Part A Total", max: maxScores.partA, score: partATotal },
  { isHeader: true, label: "Part B - Research, Publications & Creative Output" },
  ...summaryRow(applicability, "journals", { id: "B1", label: "Journal Publications / Academic Research Papers", max: 60, score: rowSum("journals", 60) }),
  ...summaryRow(applicability, "books", { id: "B2", label: "Books, Book Chapters & Edited Volumes", max: 30, score: rowSum("books", 30) }),
  ...summaryRow(applicability, "ipr", { id: "B3", label: "Patents, Copyrights, IP & Creative Product Development", max: 40, score: rowSum("ipr", 40) }),
  ...summaryRow(applicability, "externalProjects", { id: "B4", label: "Funded Research / Creative Projects & Grants", max: 20, score: rowSum("externalProjects", 20) }),
  ...summaryRow(applicability, "research", { id: "B5", label: "Research / Creative Guidance", max: 20, score: rowSum("research", 20) }),
  ...summaryRow(applicability, "consultancy", { id: "B6", label: "Consultancy, Training & Creative Commissions", max: 30, score: rowSum("consultancy", 30) }),
  ...summaryRow(applicability, "confs", { id: "B7", label: "Conference / FDP / Festival Contributions — Organised", max: 20, score: rowSum("confs", 20) }),
  ...summaryRow(applicability, "fdps", { id: "B8", label: "Conference / FDP / Industry-Studio Training Attended", max: 20, score: b8Score }),
  ...summaryRow(applicability, "awards", { id: "B9", label: "Research Awards, Fellowships, Reviewer & Citations", max: 20, score: rowSum("awards", 20) }),
  ...summaryRow(applicability, "innovation", { id: "B10", label: "Innovation, Start-ups & Technology Transfer", max: 20, score: rowSum("innovation", 20) }),
  ...summaryRow(applicability, "ict", { id: "B11", label: "ICT Content, MOOCs & E-Learning", max: 40, score: rowSum("ict", 40) }),
  ...summaryRow(applicability, "exhibitions", { id: "B12", label: "Exhibitions — Photography, Design & Applied Arts, Documentaries", max: 30, score: rowSum("exhibitions", 30) }),
  { isTotal: true, label: "Part B Total", max: maxScores.partB, score: partBTotal },
  { isHeader: true, label: "Part C - Administrative Role & University Development" },
  ...summaryRow(applicability, "uniActs", { id: "C1", label: "Administration at University Level", max: 50, score: rowSum("uniActs", 50) }),
  ...summaryRow(applicability, "deptActs", { id: "C2", label: "School / Department Level Activities", max: 30, score: rowSum("deptActs", 30) }),
  ...summaryRow(applicability, "events", { id: "C3", label: "Event Organisation", max: 20, score: rowSum("events", 20) }),
  ...summaryRow(applicability, "society", { id: "C4", label: "Contribution to Society", max: 10, score: rowSum("society", 10) }),
  ...summaryRow(applicability, "industry", { id: "C5", label: "Industry Connect", max: 10, score: rowSum("industry", 10) }),
  ...summaryRow(applicability, "alumni", { id: "C6", label: "Alumni Engagement", max: 10, score: rowSum("alumni", 10) }),
  ...summaryRow(applicability, "placements", { id: "C7", label: "Placement & Internship Support", max: 20, score: rowSum("placements", 20) }),
  { isTotal: true, label: "Part C Total", max: maxScores.partC, score: partCTotal },
  { isHeader: true, label: "Part D - Leave & Attendance Management" },
  { id: "D1", label: "Management of Leaves", max: 25, score: partDTotal },
  { isTotal: true, label: "Part D Total", max: maxScores.partD, score: partDTotal },
  { isHeader: true, label: "Part E - Annual Confidential Report (ACR)" },
  ...summaryRow(applicability, "acr", { id: "E1", label: "Annual Confidential Report", max: 50, score: rowSum("acr", 50) }),
  { isTotal: true, label: "Part E Total", max: maxScores.partE, score: rowSum("acr", 50) },
  { isGrandTotal: true, label: "Grand Total", max: maxScores.grand, score: grandTotal },
  ],
  });
  };

  const hasReviewerScoreForRole = (item) =>
    n(item?.[`${role}PartA`]) > 0 ||
    n(item?.[`${role}PartB`]) > 0 ||
    n(item?.[`${role}PartC`]) > 0 ||
    n(item?.[`${role}PartD`]) > 0 ||
    n(item?.[`${role}Total`]) > 0 ||
    String(item?.[`${role}Remarks`] || "").trim() !== "";
  const isApprovalReviewed = (item) => {
    const pendingForRole = isPendingReviewStatusFor([item.status, item.workflowStatus, item.workflow_status], role);
    return !pendingForRole && (isReviewerReviewComplete(item, role) || hasReviewerScoreForRole(item));
  };
  const pendingCount = queue.filter((item) => !isApprovalReviewed(item)).length;
  const reviewedCount = queue.filter(isApprovalReviewed).length;
  const filteredQueue = filterStatus === "All"
    ? queue
    : filterStatus === "Pending Review"
      ? queue.filter((item) => !isApprovalReviewed(item))
      : queue.filter(isApprovalReviewed);

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
      mainStyle={{ flex: 1, padding: "40px", display: "flex", flexDirection: "column", gap: 24, overflowX: "hidden", maxWidth: 1600, margin: "0 auto", width: "100%", position: "relative" }}
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
      {loadingYearData && activeTab === "my" && (
        <div className="appraisal-year-loading-overlay" role="status" aria-live="polite">
          <div className="appraisal-year-loading-card">
            <div className="appraisal-year-loading-spinner" />
            <div className="appraisal-year-loading-textwrap">
              <div className="appraisal-year-loading-text">Loading {academicYear || "academic year"} data…</div>
              <div className="appraisal-year-loading-subtext">Fetching your appraisal records</div>
              <div className="appraisal-year-loading-dots"><span /><span /><span /></div>
            </div>
          </div>
        </div>
      )}
      {activeTab === "my" && (
      <div style={{ marginBottom: 0, display: "flex", flexDirection: "column", gap: 0 }}>
        <div className="appraisal-page-header" style={{ background: "#fff", borderRadius: 14, padding: "16px 24px", boxShadow: "0 10px 28px rgba(17,24,39,0.06)", border: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, minWidth: 260 }}>
          <AppraisalHeaderImage logo="dypiu" height={78} />
          <div>
            <h2 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: "#111827", letterSpacing: 0, lineHeight: 1.05 }}>My Appraisal Form</h2>
            <div style={{ marginTop: 6, color: "#4b5563", fontSize: 13, fontWeight: 800, lineHeight: 1.25 }}>{schoolDisplayName}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10, fontSize: 13, color: "#6b7280", fontWeight: 700, flexWrap: "wrap" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#111827", fontWeight: 800 }}>
                <span style={{ width: 24, height: 24, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#ede9fe", color: "#6d28d9", border: "1px solid #ddd6fe" }}>
                  <InlineSvgIcon paths={SUMMARY_ICONS.user} size={14} />
                </span>
                <span>{form.info?.name || profile.name || sessionStorage.getItem("name") || "Faculty Member"}</span>
              </span>
              <span aria-hidden="true" style={{ width: 1, height: 20, background: "#cbd5e1", display: "inline-block" }} />
              <span>Academic Year:</span>
              <select
                value={academicYear}
                onChange={(event) => handleAcademicYearChange(event.target.value)}
                className="appraisal-year-select"
                style={{ height: 36, minWidth: 176, border: "1px solid #d1d5db", borderRadius: 9, padding: "0 12px", fontSize: 13, fontFamily: "inherit", color: "#111827", background: "#fff", outline: "none", fontWeight: 800, boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}
              >
                {academicYearOptions.map((cycle) => (
                  <option key={cycle.academic_year} value={cycle.academic_year}>
                    {cycle.academic_year} {cycle.is_open ? "(Active)" : "(Closed / Read-Only)"}
                  </option>
                ))}
              </select>
            </div>
          </div>
          </div>
          <AppraisalHeaderImage logo="iqas" height={78} />
        </div>
      </div>
      )}

      {activeTab === "approvals" && !reviewing && role !== "faculty" && (
      <>
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 18, background: "#fff", borderRadius: 14, padding: "16px 24px", boxShadow: "0 10px 28px rgba(17,24,39,0.06)", border: "1px solid #e5e7eb" }}>
<div style={{ display: "flex", alignItems: "center", gap: 14 }}>
<AppraisalHeaderImage logo="dypiu" />
<div>
<h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#0f172a", letterSpacing: -0.5 }}>Faculty's Appraisal</h1>
<div style={{ marginTop: 5, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", color: "#64748b", fontSize: 11 }}>
<span>AY</span>
<select
 value={academicYear}
 onChange={(event) =>handleAcademicYearChange(event.target.value)}
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
</div>
<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
<div style={{ fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 20, background: "#fef3c7", color: "#92400e" }}>
 {pendingCount} Pending
</div>
<div style={{ fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 20, background: "#d1fae5", color: "#065f46" }}>
 {reviewedCount} Reviewed
</div>
<AppraisalHeaderImage logo="iqas" />
</div>
</div>

<div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", background: "#fff", borderRadius: 9, boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
<span style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>Filter:</span>
 {["All", "Pending Review", "Reviewed"].map((filter) =>(
<button key={filter} onClick={() =>setFilterStatus(filter)}
 style={{ fontSize: 11, padding: "4px 12px", border: "1px solid #e2e8f0", borderRadius: 20, cursor: "pointer", fontFamily: "inherit", background: filterStatus === filter ? "#0f172a" : "none", color: filterStatus === filter ? "#f1f5f9" : "#475569" }}>
 {filter}
</button>
 ))}
</div>
      </>
      )}

 {activeTab === "my" && canSelfSubmit && (
<div style={{ display: "grid", gap: 16 }}>
{isLegacyTwoPartYear ? (
<WorkflowTracker declaration={declaration} reviews={reviews} profile={{ ...profile, school: currentSchoolValue, appraisal_role: role }} />
) : (
<div className="appraisal-status-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 316px", gap: 12, alignItems: "stretch" }}>
  <WorkflowTracker declaration={declaration} reviews={reviews} profile={{ ...profile, school: currentSchoolValue, appraisal_role: role }} />
  <div className="appraisal-progress-card" style={{ background: "#fff", borderRadius: 14, padding: "18px 22px", boxShadow: "0 10px 28px rgba(17,24,39,0.06)", border: "1px solid #e5e7eb", display: "flex", flexDirection: "column", justifyContent: "center", gap: 10 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
      <div style={{ fontSize: 14, color: "#374151", fontWeight: 800 }}>Overall Progress</div>
      <div style={{ fontSize: 22, color: "#111827", fontWeight: 900, lineHeight: 1 }}>{Math.round((totals.total / (totals.maxScores?.grand || 700)) * 100)}%</div>
    </div>
    <div style={{ height: 8, borderRadius: 999, background: "#e5e7eb", overflow: "hidden" }}>
      <div style={{ width: `${Math.round((totals.total / (totals.maxScores?.grand || 700)) * 100)}%`, height: "100%", borderRadius: 999, background: "linear-gradient(90deg,#06b6d4,#10b981)", transition: "width 300ms ease" }} />
    </div>
    <div style={{ fontSize: 14, color: "#6b7280", fontWeight: 600 }}>{totals.total.toFixed(1)} / {totals.maxScores?.grand || 700} Marks</div>
    <div aria-label="Part-wise progress" style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 5, borderTop: "1px solid #e5e7eb", paddingTop: 8 }}>
      {partWiseProgressRows.map(([label, score, max], index) =>{
        const partColor = ["#4f46e5", "#0891b2", "#059669", "#dc2626"][index] || "#4f46e5";
        const partLetter = label.replace("Part ", "");
        return (
        <div key={label} title={`${label}: ${score.toFixed(1)} / ${max}`} style={{ minWidth: 0, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6, padding: "5px 4px", textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 3, marginBottom: 1 }}>
            <span style={{ width: 14, height: 14, borderRadius: 999, display: "inline-flex", alignItems: "center", justifyContent: "center", background: `${partColor}14`, border: `1px solid ${partColor}33`, color: partColor, fontSize: 9, fontWeight: 900 }}>{partLetter}</span>
          </div>
          <div style={{ fontSize: 10, color: "#0f172a", fontWeight: 900, whiteSpace: "nowrap" }}>{score.toFixed(0)}/{max}</div>
        </div>
        );
      })}
    </div>
  </div>
</div>
)}
{!isLegacyTwoPartYear && <RejectionNotice
 declaration={declaration}
 reviews={reviews}
 form={form}
 status={declaration?.status || form.status}
 alertOnceKey={`${userEmail}:${academicYear}:${declaration?.status || form.status || ""}`}
/>}
  {!isLegacyTwoPartYear && locked && (
    <div style={{ background: appraisalWindowLockMessage || isSelectedCycleClosed ? "#fffbeb" : workflowRejected ? "#fef2f2" : "#ecfdf5", border: `1px solid ${appraisalWindowLockMessage || isSelectedCycleClosed ? "#fde68a" : workflowRejected ? "#fecaca" : "#bbf7d0"}`, color: appraisalWindowLockMessage || isSelectedCycleClosed ? "#92400e" : workflowRejected ? "#991b1b" : "#166534", borderRadius: 9, padding: "11px 14px", fontSize: 12, fontWeight: 750, display: "flex", alignItems: "center", gap: 10 }}>
      <span aria-hidden="true" style={{ width: 24, height: 24, borderRadius: "50%", background: appraisalWindowLockMessage || isSelectedCycleClosed ? "#fef3c7" : workflowRejected ? "#fee2e2" : "#dcfce7", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 14, fontWeight: 900 }}>{appraisalWindowLockMessage || isSelectedCycleClosed ? "!" : "i"}</span>
      <span>
        {appraisalWindowLockMessage
          ? appraisalWindowLockMessage
          : workflowRejected
          ? "This appraisal was rejected. Review the approval status in the tracker above."
          : isSelectedCycleClosed
            ? closedAppraisalCycleMessage
            : "Submitted and locked for review. Your saved data is visible here, but editing is disabled while authorities review it."}
      </span>
    </div>
  )}

  {isLegacyTwoPartYear ? (
    <DesignArtsPreviousYearView
      form={form}
      docs={docs}
      response={previousYearResponse}
      academicYear={academicYear}
      sectionView={selfSectionView}
      onSectionChange={handleSelfSectionChange}
      profile={profile}
      reviews={reviews}
    />
  ) : isSelectedCycleClosed ? (
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
  {(selfSectionView === "partA" || selfSectionView === "partB" || selfSectionView === "partC" || selfSectionView === "partD" || selfSectionView === "partE") && (
<>
<DesignArtsForm
 form={form}
 setForm={setForm}
 docs={docs}
 setDocs={setDocs}
 mode="self"
 locked={locked}
 sectionView={selfSectionView}
/>
<SectionSaveFooter
 label={{ partA: "Part A", partB: "Part B", partC: "Part C", partD: "Part D", partE: "Part E" }[selfSectionView]}
 saved={Boolean(sectionSaveStatus[selfSectionView])}
 saving={savingSection === selfSectionView}
 locked={locked}
 onSave={() =>handleSaveSelfSection(selfSectionView)}
/>
</>
 )}
  {selfSectionView === "summary" && (
<div style={{ display: "grid", gap: 16 }}>
<div className="fa-section-card appraisal-section-card" style={{ background: "#fff", borderRadius: 14, boxShadow: "0 18px 50px rgba(17,24,39,0.08)", overflow: "hidden", border: "1px solid #e5e7eb", borderTop: "3px solid #4f46e5" }}>
  <div className="appraisal-part-header" style={{ padding: "18px 24px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, background: "linear-gradient(180deg,#ffffff 0%,#fcfdff 100%)" }}>
    <div style={{ minWidth: 0, display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ width: 36, height: 36, borderRadius: 12, background: "#eef2ff", color: "#4f46e5", border: "1px solid #e0e7ff", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <InlineSvgIcon paths={SUMMARY_ICONS.cap} size={19} />
      </span>
      <div style={{ fontWeight: 900, fontSize: 18, color: "#4f46e5", letterSpacing: 0 }}>Appraisal Summary & Submission</div>
    </div>
  </div>
  <div style={{ padding: "24px 28px 28px", display: "grid", gap: 20 }}>
    <table className="appraisal-summary-table" style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, marginBottom: 0, border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden", boxShadow: "0 12px 26px rgba(15,23,42,0.04)" }}>
      <tbody>
        <SummaryRow label="Part A - Teaching & Learning" score={totals.partA} max={totals.maxScores?.partA || PART_A_MAX} color="#4f46e5" tone="#eef2ff" iconTone="#eef2ff" icon="book" />
        <SummaryRow label="Part B - Research & Innovation" score={totals.partB} max={totals.maxScores?.partB || PART_B_MAX} color="#7c3aed" tone="#f5f3ff" iconTone="#f5f3ff" icon="flask" />
        <SummaryRow label="Part C - Administrative Contribution" score={totals.partC} max={totals.maxScores?.partC || 150} color="#0f766e" tone="#ccfbf1" iconTone="#ccfbf1" icon="building" />
        <SummaryRow label="Part D - Leave & Attendance Management" score={totals.partD} max={totals.maxScores?.partD || PART_D_MAX} color="#0891b2" tone="#cffafe" iconTone="#cffafe" icon="document" />
        <SummaryRow label="Grand Total" score={totals.total} max={totals.maxScores?.grand || GRAND_MAX} color="#dc2626" tone="#fee2e2" iconTone="#fee2e2" icon="sigma" />
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
 {/* - Loading indicator - */}
 {loadingQueue && (
<div style={{ display: "flex", alignItems: "center", gap: 10, padding: "24px 0", color: "#64748b", fontSize: 13 }}>
<div className="fa-pulse" style={{ width: 8, height: 8, borderRadius: "50%", background: ACCENT }} />
 Loading {schoolDisplayName} queue...
</div>
 )}

 {/* - Empty state - */}
 {!loadingQueue && queue.length === 0 && (
<div style={{ textAlign: "center", padding: "56px 24px", background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0" }}>
<div style={{ width: 52, height: 52, borderRadius: "50%", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", fontSize: 24 }}>Done</div>
<div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a", marginBottom: 6 }}>All caught up!</div>
<div style={{ color: "#64748b", fontSize: 13 }}>No {schoolDisplayName} submissions are assigned to you at this time.</div>
</div>
 )}

 {/* - Faculty cards - */}
<div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14 }}>
 {filteredQueue.map((item) =>{
 const initials = (item.name || "?").trim().split(/\s+/).map(w =>w[0]).join("").substring(0, 2).toUpperCase();
 const mergedItem = mergeForm(emptyDesignArtsForm(), item);
 const facultyTotals = calculateDesignArtsTotals(mergedItem, "score");
 const reviewerTotals = calculateDesignArtsTotals(mergedItem, role);
 const hasReviewerScores = reviewerTotals.partA >0 || reviewerTotals.partB >0 || reviewerTotals.partC >0 || reviewerTotals.partD >0 || reviewerTotals.total >0;
 const pendingForRole = isPendingReviewStatusFor([item.status, item.workflowStatus, item.workflow_status], role);
 const reviewComplete = !pendingForRole && (isReviewerReviewComplete(item, role) || hasReviewerScores);
 const savedReviewerTotals = {
 partA: n(item?.[`${role}PartA`]),
 partB: n(item?.[`${role}PartB`]),
 partC: n(item?.[`${role}PartC`]),
 partD: n(item?.[`${role}PartD`]),
 total: n(item?.[`${role}Total`]),
 };
 const reviewerDisplayTotals = {
 ...reviewerTotals,
 partA: reviewerTotals.partA || savedReviewerTotals.partA,
 partB: reviewerTotals.partB || savedReviewerTotals.partB,
 partC: reviewerTotals.partC || savedReviewerTotals.partC,
 partD: reviewerTotals.partD || savedReviewerTotals.partD,
 total: reviewerTotals.total || savedReviewerTotals.total,
 };
 const itemTotals = reviewComplete ? reviewerDisplayTotals : facultyTotals;
 const submittedScore = (stored, legacy, calculated) =>
 String(stored ?? legacy ?? "").trim() !== "" ? n(stored ?? legacy) : calculated;
 const submittedTotals = {
 partA: submittedScore(item.selfPartA, item.partATotal, facultyTotals.partA),
 partB: submittedScore(item.selfPartB, item.partBTotal, facultyTotals.partB),
 partC: submittedScore(item.selfPartC, item.partCTotal, facultyTotals.partC),
 partD: submittedScore(item.selfPartD, item.partDTotal, facultyTotals.partD),
 total: submittedScore(item.selfTotal, item.grandTotal, facultyTotals.total),
 };
 const scoreLabel = `Submitted: ${item.submittedOn || ""}`;
 const maxScores = itemTotals.maxScores || facultyTotals.maxScores || { partA: PART_A_MAX, partB: PART_B_MAX, partC: 0, partD: 0, grand: GRAND_MAX };
 const displayTotals = reviewComplete ? itemTotals : submittedTotals;
 const itemAcademicYear = item.academic_year || item.academicYear || item.info?.ay || academicYear || APP_INFO.DEFAULT_AY;
 const metricLabelPrefix = reviewComplete ? (role === "director" ? "Dir" : roleLabel(role)) : "";
 const reviewMetrics = legacyDashboardMetrics({
 academicYear: itemAcademicYear,
 labelPrefix: metricLabelPrefix,
 partA: displayTotals.partA,
 partB: displayTotals.partB,
 total: displayTotals.total,
 }) || [
 { label: metricLabelPrefix ? `${metricLabelPrefix} Part A` : "Part A", val: displayTotals.partA, max: maxScores.partA, color: "#6366f1" },
 { label: metricLabelPrefix ? `${metricLabelPrefix} Part B` : "Part B", val: displayTotals.partB, max: maxScores.partB, color: "#0ea5e9" },
 { label: metricLabelPrefix ? `${metricLabelPrefix} Part C` : "Part C", val: displayTotals.partC, max: maxScores.partC, color: "#10b981" },
 { label: metricLabelPrefix ? `${metricLabelPrefix} Part D` : "Part D", val: displayTotals.partD, max: maxScores.partD, color: "#f59e0b" },
 { label: metricLabelPrefix ? `${metricLabelPrefix} Total` : "Total", val: displayTotals.total, max: maxScores.grand, color: "#4338ca" },
 ];
 return (
<div key={item.id} style={{ background: "#fff", borderRadius: 12, padding: "18px 20px", boxShadow: "0 1px 6px rgba(0,0,0,.07)", display: "flex", flexDirection: "column", gap: 14 }}>
<div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
<Avatar initials={initials} src={item.avatarUrl} color={item.avatarColor} size={58} />
<div style={{ flex: 1, minWidth: 0 }}>
<div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
</div>
<StatusBadge status={item.status} />
</div>

<ReviewMetricsStrip
 metrics={reviewMetrics}
 docs={item.docs}
 item={item}
/>

<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f1f5f9", paddingTop: 12 }}>
<div style={{ fontSize: 10, color: "#94a3b8" }}>{scoreLabel}</div>
<button
 disabled={reviewLoading === item.id}
 onClick={async () =>{
 setReviewLoading(item.id);
 try {
 const data = await fetchSavedAppraisal({
 facultyEmail: item.email,
 academicYear: item.academic_year || item.academicYear || item.info?.ay || APP_INFO.DEFAULT_AY || "2026-2027",
 reviewerRole: role,
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
 }}
 style={{ fontSize: 11, padding: "7px 18px", background: reviewComplete ? "#1e293b" : "#312e81", color: "#f1f5f9", border: "none", borderRadius: 6, cursor: reviewLoading === item.id ? "wait" : "pointer", fontWeight: 700, fontFamily: "inherit", opacity: reviewLoading === item.id ? 0.7 : 1 }}
 >
 {reviewLoading === item.id ? "Loading..." : reviewComplete ? "View Review" : "Review Form"}
</button>
</div>
</div>
 );
 })}
</div>

 {!loadingQueue && queue.length > 0 && filteredQueue.length === 0 && (
<div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>
<div style={{ fontWeight: 700, color: "#0f172a" }}>All caught up!</div>
<div style={{ color: "#64748b", fontSize: 12, marginTop: 6 }}>No forms match the selected filter.</div>
</div>
 )}
</div>
 )}

 {activeTab === "approvals" && reviewing && (
<DesignArtsAuthorityReviewPanel
 person={reviewing}
 reviewerRole={role}
 onBack={() =>setReviewing(null)}
 onSubmit={handleSubmitReview}
 readOnly={isReviewerReviewComplete(reviewing, role)}
 showReport={false}
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





