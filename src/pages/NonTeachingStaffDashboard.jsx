import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clearUserSession, storeUserSession, getActiveAcademicYear, setActiveAcademicYear, getSessionItem, normalizeAcademicYearLabel } from "../auth/session";
import { APP_INFO } from "../constants/formConfig";
import { normalizeNonTeachingRole } from "../constants/nonTeachingHierarchy";
import { api } from "../services/api";
import { getMe } from "../services/authService";
import { loadReviewerDraft, saveReviewerDraft } from "../services/reviewWorkflow";
import { isAllowedAttachmentFile, isFilled } from "../utils/appraisalFormUtils";
import {
  NON_TEACHING_MAX,
  NON_TEACHING_STATUS,
  RATING_SCALE,
  RATING_SECTIONS,
  SELF_ITEMS,
  calculateNonTeachingTotals,
  emptyNonTeachingForm,
  fetchNonTeachingQueueForRole,
  isNonTeachingRejectedStatus,
  loadNonTeachingAppraisal,
  loadNonTeachingWorkflow,
  nonTeachingRoleLabel,
  normalizeNonTeachingStatus,
  openNonTeachingReport,
  primeFormForReviewer,
  saveNonTeachingDraft,
  submitNonTeachingReview,
  submitNonTeachingSelfAppraisal,
  validateNonTeachingForm,
  visibleNonTeachingReviewRoles,
  workflowDesignationForNonTeachingRole,
} from "../services/nonTeachingWorkflow";
import { clampScore, scoreRemaining } from "../utils/appraisalFormUtils";
import { profileFromsessionStorage } from "../utils/hierarchy";
import { n } from "../features/faculty-appraisal/shared";
import AppraisalHeaderImage from "../components/AppraisalHeaderImage";
import RejectionNotice from "../components/RejectionNotice";
import SummaryOtherInfoField from "../components/SummaryOtherInfoField";
import { SectionCard } from "../features/faculty-appraisal/components/formPrimitives";
import { WORKFLOW_STATUSES, currentWorkflowStep, isWorkflowComplete } from "../utils/workflow";
import { T, TH, TD, TDC } from "../features/faculty-appraisal/components/formPrimitiveStyles";
import { Avatar, ScoreBar, ReviewMetricsStrip, LogoutConfirmModal } from "../components/dashboard/dashboardPrimitives";

const ACCENT = "#1d4ed8";
const REG_ACCENT = "#155e75";
const VC_ACCENT = "#6d28d9";
const clampOptionalScore = (value, max) => String(value ?? "").trim() === "" ? "" : clampScore(value, max);

const normalizeAcademicYearCycles = (cyclesData) => {
  const normalizeCycle = (cycle) => {
    if (!cycle) return null;
    if (typeof cycle === "string") {
      return { academic_year: normalizeAcademicYearLabel(cycle), is_open: cycle === APP_INFO.DEFAULT_AY };
    }
    const academicYear = normalizeAcademicYearLabel(cycle.academic_year || cycle.academicYear || cycle.year || cycle.year_label || "");
    if (!academicYear) return null;
    return {
      academic_year: academicYear,
      is_open: cycle.is_open ?? cycle.isOpen ?? cycle.active ?? cycle.open ?? (academicYear === APP_INFO.DEFAULT_AY),
    };
  };

  let list = [];
  if (Array.isArray(cyclesData)) list = cyclesData.map(normalizeCycle).filter(Boolean);
  else if (Array.isArray(cyclesData?.cycles)) list = cyclesData.cycles.map(normalizeCycle).filter(Boolean);
  else if (Array.isArray(cyclesData?.data)) list = cyclesData.data.map(normalizeCycle).filter(Boolean);

  if (list.length === 0) {
    list.push({ academic_year: APP_INFO.DEFAULT_AY || "2026-2027", is_open: true });
  }

  return list
    .reduce((acc, cycle) => {
      if (!acc.some((existing) => existing.academic_year === cycle.academic_year)) acc.push(cycle);
      return acc;
    }, [])
    .sort((a, b) => b.academic_year.localeCompare(a.academic_year));
};

const storedAcademicYearCycles = () =>
  getSessionItem("availableCyclesSource") === "backend"
    ? JSON.parse(getSessionItem("availableCycles") || "[]")
    : [];

// Non-teaching staff only: "My Appraisal" should default to the active cycle when one exists,
// otherwise fall back to the latest closed cycle (cycles are sorted newest-first) rather than
// whatever academic year happens to be cached globally, which may not reflect a real open cycle.
const resolveDefaultAcademicYear = () => {
  const cycles = normalizeAcademicYearCycles(storedAcademicYearCycles());
  const activeCycle = cycles.find((cycle) => cycle.is_open);
  if (activeCycle) return activeCycle.academic_year;
  if (cycles.length) return cycles[0].academic_year;
  return getActiveAcademicYear(APP_INFO.DEFAULT_AY);
};

const roleAccent = (role) => {
  const normalized = normalizeNonTeachingRole(role, role);
  if (normalized === "registrar") return REG_ACCENT;
  if (normalized === "vc") return VC_ACCENT;
  return ACCENT;
};

const hasVisibleReviewRole = (visibleRoles = [], ...aliases) => {
  const normalizedRoles = new Set(
    visibleRoles.map((role) =>
      normalizeNonTeachingRole(role, role) === "reporting_officer" ? "ro" : role,
    ),
  );
  return aliases.some((alias) => normalizedRoles.has(alias));
};

const hasText = (value) => String(value ?? "").trim() !== "";

const isCurrentNonTeachingReviewApproved = (item = {}, role) => {
  const normalizedRole = normalizeNonTeachingRole(role, role);
  const status = normalizeNonTeachingStatus(item.status || item.form?.status);

  if (normalizedRole === "reporting_officer") {
    return [
      NON_TEACHING_STATUS.RO_REVIEWED,
      NON_TEACHING_STATUS.PENDING_REGISTRAR_REVIEW,
      NON_TEACHING_STATUS.REGISTRAR_REVIEWED,
      NON_TEACHING_STATUS.PENDING_VC_REVIEW,
      NON_TEACHING_STATUS.VC_APPROVED,
    ].includes(status) || n(item.roTotal || item.ro_total) > 0 || hasText(item.form?.roRemarks);
  }

  if (normalizedRole === "registrar") {
    return [
      NON_TEACHING_STATUS.REGISTRAR_REVIEWED,
      NON_TEACHING_STATUS.PENDING_VC_REVIEW,
      NON_TEACHING_STATUS.VC_APPROVED,
    ].includes(status) || n(item.registrarTotal || item.registrar_total) > 0 || hasText(item.form?.registrarRemarks);
  }

  if (normalizedRole === "vc") {
    return status === NON_TEACHING_STATUS.VC_APPROVED || n(item.vcTotal || item.vc_total) > 0 || hasText(item.form?.vcRemarks);
  }

  return false;
};

const initials = (name = "User") =>
  String(name || "User")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const emptyWorkflow = {
  workflowId: null,
  workflowName: "Approval Workflow",
  currentStep: null,
  status: "NOT_STARTED",
  steps: [],
  approvalSteps: [],
};

function TextInput({ value, onChange, readOnly = false, placeholder = "", type = "text" }) {
  return (
    <input
      type={type}
      value={value ?? ""}
      onChange={(event) => onChange(event.target.value)}
      readOnly={readOnly}
      placeholder={placeholder}
      style={{ width: "100%", boxSizing: "border-box", height: 34, border: "1px solid #cbd5e1", borderRadius: 6, padding: "6px 9px", fontSize: 12, fontFamily: "inherit", outline: "none", background: readOnly ? "#f8fafc" : "#fff", color: "#0f172a" }}
    />
  );
}

function TextArea({ value, onChange, readOnly = false, placeholder = "", rows = 3 }) {
  const large = rows >= 7;
  return (
    <textarea
      value={value ?? ""}
      onChange={(event) => onChange(event.target.value)}
      readOnly={readOnly}
      placeholder={placeholder}
      rows={rows}
      style={{ width: "100%", boxSizing: "border-box", height: large ? 235 : undefined, minHeight: large ? 235 : undefined, border: "1px solid #cbd5e1", borderRadius: 6, padding: large ? "10px 11px" : "8px 10px", fontSize: 12, lineHeight: large ? 1.5 : undefined, fontFamily: "inherit", resize: large ? "none" : "vertical", outline: "none", background: readOnly ? "#f8fafc" : "#fff", color: "#0f172a" }}
    />
  );
}

function MarksInput({ value, onChange, max, readOnly = false, accent = ACCENT }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <input
        type="number"
        min="0"
        max={max}
        step="0.5"
        value={value ?? ""}
        onChange={(event) => onChange(clampOptionalScore(event.target.value, max))}
        readOnly={readOnly}
        style={{ width: 62, textAlign: "center", border: `1.5px solid ${accent}`, borderRadius: 6, padding: "5px 6px", fontSize: 12, fontFamily: "inherit", outline: "none", background: readOnly ? "#f8fafc" : "#eff6ff" }}
      />
      <span style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>/ {max}</span>
    </div>
  );
}

function RatingPicker({ value, onChange, readOnly = false }) {
  return (
    <div style={{ display: "flex", gap: 4, justifyContent: "center", flexWrap: "wrap" }}>
      {RATING_SCALE.map((rating) => {
        const active = n(value) === rating.value;
        return (
          <button
            key={rating.value}
            type="button"
            title={`${rating.label} (${rating.value})`}
            disabled={readOnly}
            onClick={() => onChange(rating.value)}
            style={{ width: 30, height: 30, border: active ? `1.5px solid ${rating.color}` : "1px solid #e2e8f0", borderRadius: 5, background: active ? rating.bg : "#fff", color: active ? rating.color : "#94a3b8", fontWeight: 800, cursor: readOnly ? "default" : "pointer", fontFamily: "inherit" }}
          >
            {rating.value}
          </button>
        );
      })}
    </div>
  );
}

function DocCell({ id, docs, setDocs, readOnly = false }) {
  const ref = useRef(null);
  const [uploading, setUploading] = useState(false);
  const files = Array.isArray(docs?.[id]) ? docs[id] : docs?.[id] ? [docs[id]] : [];

  const handleFiles = async (selectedFiles) => {
    if (readOnly) return;
    const fileList = Array.from(selectedFiles || []);
    if (!fileList.length) return;

    setUploading(true);
    try {
      const uploadedFiles = [];
      for (const file of fileList) {
        let uploaded = null;
        try {
          const fd = new FormData();
          fd.append("file", file);
          fd.append("folder", `non-teaching-appraisal/${id}`);
          const res = await api.post("/upload", fd, { suppressAuthRedirect: true });
          if (res) {
            uploaded = typeof res === "string" ? { url: res, name: file.name, type: file.type } : {
              url: res.url || res.fileUrl || res.path || res.location || res.data?.url,
              name: res.name || file.name,
              type: res.type || file.type,
              size: file.size,
            };
          }
        } catch (err) {
          console.warn("Upload fallback to local file:", err);
        }

        if (!uploaded || !uploaded.url) {
          const localUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => resolve(URL.createObjectURL(file));
            reader.readAsDataURL(file);
          });
          uploaded = { name: file.name, url: localUrl, type: file.type || "application/pdf", size: file.size };
        }

        uploadedFiles.push(uploaded);
      }
      setDocs((current) => ({
        ...current,
        [id]: [...(Array.isArray(current[id]) ? current[id] : current[id] ? [current[id]] : []), ...uploadedFiles],
      }));
    } catch (err) {
      console.error("Upload error:", err);
      alert(`Unable to upload file.\n\n${err.message}`);
    } finally {
      setUploading(false);
      if (ref.current) ref.current.value = "";
    }
  };

  const removeFile = (index) => {
    setDocs((current) => {
      const nextFiles = [...(current[id] || [])];
      nextFiles.splice(index, 1);
      return { ...current, [id]: nextFiles };
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {files.length === 0 && readOnly && <span style={{ color: "#94a3b8", fontSize: 10 }}>No documents</span>}
      {files.map((file, index) => (
        <div key={`${file.url || file.name}-${index}`} style={{ display: "grid", gridTemplateColumns: readOnly ? "1fr" : "minmax(0, 1fr) 18px", alignItems: "center", gap: 4, background: "#ecfdf5", border: "1px solid #bbf7d0", borderRadius: 999, padding: "4px 8px" }}>
          <a href={file.url} target="_blank" rel="noreferrer" style={{ minWidth: 0, color: "#14532d", fontSize: 10, fontWeight: 800, textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={file.name}>
            {file.name || "Document"}
          </a>
          {!readOnly && (
            <button type="button" aria-label={`Remove ${file.name || "attachment"}`} onClick={() => removeFile(index)} style={{ width: 18, height: 18, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#fff", border: "1px solid #fecaca", borderRadius: "50%", color: "#dc2626", fontSize: 12, lineHeight: 1, cursor: "pointer", fontWeight: 900, padding: 0 }}>×</button>
          )}
        </div>
      ))}
      {!readOnly && (
        <div role="button" tabIndex={0} aria-label="Attach supporting document" onClick={() => !uploading && ref.current?.click()} onKeyDown={(event) => { if ((event.key === "Enter" || event.key === " ") && !uploading) ref.current?.click(); }} style={{ display: "inline-flex", alignItems: "center", gap: 7, cursor: uploading ? "not-allowed" : "pointer", padding: "6px 10px", border: "1px dashed #cbd5e1", borderRadius: 8, background: "#f8fafc", opacity: uploading ? 0.7 : 1, color: "#475569", fontWeight: 700, fontSize: 10 }}>
          <DocIcon />
          {uploading ? "Uploading..." : "Attach supporting documents"}
          <input ref={ref} type="file" multiple accept="image/*,.pdf,application/pdf" disabled={uploading} onChange={(event) => handleFiles(event.target.files)} style={{ display: "none" }} />
        </div>
      )}
    </div>
  );
}

function DocIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v5h5" />
      <path d="M9 13h6" />
      <path d="M9 17h4" />
    </svg>
  );
}

function SelfAppraisalTable({ form, setForm, readOnly, accent }) {
  const setItem = (key, field, value) => {
    setForm((current) => ({
      ...current,
      [key]: { ...(current[key] || {}), [field]: value },
    }));
  };

  const setDocs = (updater) => {
    setForm((current) => ({
      ...current,
      docs: typeof updater === "function" ? updater(current.docs || {}) : updater,
    }));
  };

  return (
    <SectionCard title="Part A - Self Appraisal Details" subtitle={`Max ${NON_TEACHING_MAX.partA} marks. Attach proof wherever applicable.`} accent={accent}>
      <div style={{ overflowX: "auto" }}>
        <table style={T}>
          <thead>
            <tr>
              <th style={TH}>SN</th>
              <th style={{ ...TH, textAlign: "left" }}>Particular</th>
              <th style={{ ...TH, textAlign: "left" }}>Description</th>
              <th style={TH}>Documents</th>
              <th style={TH}>Marks Claimed</th>
            </tr>
          </thead>
          <tbody>
            {SELF_ITEMS.map((item, index) => (
              <tr key={item.key} style={index % 2 ? { background: "#f8fafc" } : undefined}>
                <td style={TDC}>{index + 1}</td>
                <td style={{ ...TD, minWidth: 170, fontWeight: 700, color: "#0f172a" }}>
                  {item.label}
                  <div style={{ color: "#64748b", fontSize: 10, marginTop: 3, fontWeight: 500 }}>Max {item.max}</div>
                </td>
                <td style={{ ...TD, minWidth: 300 }}>
                  <TextArea
                    value={form[item.key]?.text}
                    onChange={(value) => setItem(item.key, "text", value)}
                    readOnly={readOnly}
                    placeholder={`Enter ${item.label.toLowerCase()}...`}
                    rows={3}
                  />
                </td>
                <td style={{ ...TD, minWidth: 190 }}>
                  <DocCell id={item.key} docs={form.docs || {}} setDocs={setDocs} readOnly={readOnly} />
                </td>
                <td style={TDC}>
                  <MarksInput
                    value={form[item.key]?.marks}
                    max={item.max}
                    accent={accent}
                    readOnly={readOnly}
                    onChange={(value) => setItem(item.key, "marks", value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

function SummaryPanel({ form, onSubmit, onUpdateRemarks, onUpdateSummaryOtherInfo, onReport, submitting, locked, confirmed, setConfirmed, accent, showReport = true }) {
  const self = calculateNonTeachingTotals(form, "self");
  const selfMax = NON_TEACHING_MAX.partA;

  return (
    <SectionCard title="Summary of Total Score" subtitle={`Max ${selfMax} marks`} accent="#059669" scoreBadge={`${self.total.toFixed(1)} / ${selfMax}`}>
      <div style={{ border: "1px solid #dbe3ef", borderRadius: 10, padding: "10px 14px", background: "#f8fafc", boxShadow: "0 8px 18px rgba(15,23,42,0.03)" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, marginBottom: 6 }}>
          <span style={{ color: "#64748b", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.4 }}>Self Claimed Score</span>
          <span style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>
            <span style={{ color: ACCENT, fontSize: 16, fontWeight: 900 }}>{self.total.toFixed(1)}</span> / {selfMax} &nbsp;|&nbsp; {scoreRemaining(self.total, selfMax).toFixed(1)} remaining
          </span>
        </div>
        <ScoreBar score={self.total} max={selfMax} color={ACCENT} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
        <SummaryOtherInfoField
          value={form.summaryOtherInfo}
          onChange={onUpdateSummaryOtherInfo}
          readOnly={locked}
          rows={5}
        />

        <label style={{ display: "grid", gap: 8, marginBottom: 0 }}>
          <span style={{ color: "#334155", fontSize: 12, fontWeight: 900 }}>Remarks</span>
          <TextArea
            value={form.remarks}
            readOnly={locked}
            rows={5}
            placeholder="Optional remarks for the next authority..."
            onChange={onUpdateRemarks}
          />
        </label>
      </div>

      {!locked && (
        <label className="appraisal-confirmation-card" style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "11px 12px", background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10, fontSize: 12, color: "#334155", lineHeight: 1.5 }}>
          <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} style={{ marginTop: 3, accentColor: "#16a34a" }} />
          <span>I have verified all the details and confirm that the information provided is correct.</span>
        </label>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        {showReport && (
          <button type="button" className="appraisal-report-button" onClick={onReport} style={{ padding: "10px 20px", border: "1.5px solid #d1d5db", borderRadius: 10, background: "#fff", color: "#475569", cursor: "pointer", fontWeight: 700, fontFamily: "inherit" }}>
            Generate Report
          </button>
        )}
        {!locked && (
          <button type="button" className="appraisal-submit-button" onClick={onSubmit} disabled={!confirmed || submitting} style={{ padding: "10px 24px", border: "none", borderRadius: 10, background: confirmed ? accent : "#94a3b8", color: "#fff", cursor: confirmed && !submitting ? "pointer" : "not-allowed", fontWeight: 800, fontFamily: "inherit" }}>
            {submitting ? "Submitting..." : "Submit"}
          </button>
        )}
      </div>
    </SectionCard>
  );
}

const APPROVAL_STEP_TONE = {
  SUBMITTED: { emoji: "📤", bg: "#eff6ff", color: "#1d4ed8", border: "#93c5fd", chip: "#dbeafe", label: "Submitted" },
  [WORKFLOW_STATUSES.PENDING]: { emoji: "⏳", bg: "#fffbeb", color: "#92400e", border: "#fcd34d", chip: "#fef3c7", label: "Pending" },
  [WORKFLOW_STATUSES.APPROVED]: { emoji: "✅", bg: "#ecfdf5", color: "#166534", border: "#86efac", chip: "#dcfce7", label: "Approved" },
  [WORKFLOW_STATUSES.COMPLETED]: { emoji: "✅", bg: "#ecfdf5", color: "#166534", border: "#86efac", chip: "#dcfce7", label: "Approved" },
  [WORKFLOW_STATUSES.REJECTED]: { emoji: "⚠️", bg: "#fef2f2", color: "#991b1b", border: "#fca5a5", chip: "#fee2e2", label: "Rejected" },
  [WORKFLOW_STATUSES.WAITING]: { emoji: "🕒", bg: "#f8fafc", color: "#64748b", border: "#e2e8f0", chip: "#f1f5f9", label: "Waiting" },
  [WORKFLOW_STATUSES.SKIPPED]: { emoji: "➖", bg: "#f8fafc", color: "#94a3b8", border: "#e2e8f0", chip: "#f1f5f9", label: "Skipped" },
};

function NonTeachingApprovalTracker({ workflow }) {
  const steps = workflow?.steps || [];
  const notStartedYet = !steps.length || steps[0]?.status === WORKFLOW_STATUSES.DRAFT;

  if (notStartedYet) {
    return (
      <div className="appraisal-info-banner" style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "18px 24px", fontSize: 13, color: "#374151", boxShadow: "0 12px 34px rgba(17,24,39,0.07)", display: "flex", alignItems: "center", gap: 14 }}>
        <span aria-hidden="true" style={{ width: 38, height: 38, borderRadius: "50%", background: "#eef2ff", color: "#4338ca", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 900, flexShrink: 0, fontSize: 16 }}>i</span>
        <span>Submit the appraisal to see the approval route and live authority status here.</span>
      </div>
    );
  }

  const rejectedStep = steps.find((step) => step.status === WORKFLOW_STATUSES.REJECTED);
  const complete = isWorkflowComplete(workflow);
  const current = currentWorkflowStep(workflow);
  const subtitle = rejectedStep
    ? "The approval chain has stopped because this submission was rejected."
    : complete
      ? "All approval stages are complete."
      : current
        ? `Next: ${current.designation}`
        : "Awaiting the next review stage.";
  const badgeStatus = rejectedStep ? "Rejected" : complete ? "Reviewed" : "Pending Review";

  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "20px 24px", boxShadow: "0 12px 34px rgba(17,24,39,0.07)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#111827" }}>Approval Status Tracker</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{subtitle}</div>
        </div>
        <NonTeachingStatusBadge status={badgeStatus} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))`, gap: 16, overflowX: "visible", paddingBottom: 4 }}>
        {steps.map((step, index) => {
          const tone = step.isInitial ? APPROVAL_STEP_TONE.SUBMITTED : (APPROVAL_STEP_TONE[step.status] || APPROVAL_STEP_TONE[WORKFLOW_STATUSES.WAITING]);
          const isLast = index === steps.length - 1;
          return (
            <div key={`${step.stepNo}-${step.designation}`} style={{ border: `1px solid ${tone.border}`, background: `linear-gradient(180deg, ${tone.bg} 0%, #ffffff 100%)`, borderRadius: 18, padding: "10px 12px", minHeight: 84, boxShadow: "0 10px 24px rgba(15,23,42,0.07)", position: "relative", overflow: "visible" }}>
              {!isLast && (
                <span aria-hidden="true" style={{ position: "absolute", right: -17, top: "50%", transform: "translateY(-50%)", width: 18, height: 18, borderRadius: "50%", background: "#ffffff", border: "1px solid #e2e8f0", color: "#64748b", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, zIndex: 3, boxShadow: "0 6px 14px rgba(15,23,42,0.08)" }}>
                  {"→"}
                </span>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 10, color: tone.color, fontWeight: 900, textTransform: "uppercase", letterSpacing: 0.5 }}>
                <span aria-hidden="true" style={{ width: 22, height: 22, borderRadius: "50%", background: tone.chip, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.65)" }}>
                  {tone.emoji}
                </span>
                <span>{tone.label}</span>
              </div>
              <div style={{ marginTop: 6, fontSize: 12, fontWeight: 800, color: "#0f172a", lineHeight: 1.18 }}>
                {step.isInitial ? "Staff Submission" : step.designation}
              </div>
              <div style={{ marginTop: 4, fontSize: 10, color: "#64748b", lineHeight: 1.25 }}>
                {step.reviewedAt ? new Date(step.reviewedAt).toLocaleString() : "No timestamp yet"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NonTeachingProgressCard({ totals, max }) {
  // Non-teaching staff only ever fill in Part A on their own appraisal
  // (Part B is authority-only), so progress is measured out of Part A's max, not the grand total.
  const total = n(totals.partA);
  const grandMax = max.partA || 1;
  const overallProgress = Math.min(100, Math.round((total / grandMax) * 100)) || 0;
  const parts = [
    ["Part A", n(totals.partA), max.partA, "#4f46e5"],
  ];

  return (
    <div className="appraisal-progress-card" style={{ background: "#fff", borderRadius: 14, padding: "18px 22px", boxShadow: "0 10px 28px rgba(17,24,39,0.06)", border: "1px solid #e5e7eb", display: "flex", flexDirection: "column", justifyContent: "center", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
        <div style={{ fontSize: 14, color: "#374151", fontWeight: 800 }}>Overall Progress</div>
        <div style={{ fontSize: 22, color: "#111827", fontWeight: 900, lineHeight: 1 }}>{overallProgress}%</div>
      </div>
      <div aria-label={`Overall progress ${overallProgress}%`} style={{ height: 8, borderRadius: 999, background: "#e5e7eb", overflow: "hidden" }}>
        <div style={{ width: `${overallProgress}%`, height: "100%", borderRadius: 999, background: "linear-gradient(90deg,#06b6d4,#10b981)", transition: "width 300ms ease" }} />
      </div>
      <div style={{ fontSize: 14, color: "#6b7280", fontWeight: 600 }}>{total.toFixed(1)} / {grandMax} Marks</div>
      <div aria-label="Part-wise progress" style={{ display: "grid", gridTemplateColumns: `repeat(${parts.length}, minmax(0, 1fr))`, gap: 5, borderTop: "1px solid #e5e7eb", paddingTop: 8 }}>
        {parts.map(([label, score, partMax, partColor]) => {
          const partLetter = label.replace("Part ", "");
          return (
            <div key={label} title={`${label}: ${score.toFixed(1)} / ${partMax}`} style={{ minWidth: 0, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6, padding: "5px 4px", textAlign: "center" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 3, marginBottom: 1 }}>
                <span style={{ width: 14, height: 14, borderRadius: 999, display: "inline-flex", alignItems: "center", justifyContent: "center", background: `${partColor}14`, border: `1px solid ${partColor}33`, color: partColor, fontSize: 9, fontWeight: 900 }}>{partLetter}</span>
              </div>
              <div style={{ fontSize: 10, color: "#0f172a", fontWeight: 900, whiteSpace: "nowrap" }}>{score.toFixed(0)}/{partMax}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NonTeachingClosedYearNotice({ academicYear }) {
  return (
    <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
      <span aria-hidden="true" style={{ color: "#92400e", fontSize: 16, fontWeight: 900, flexShrink: 0 }}>!</span>
      <span style={{ color: "#92400e", fontSize: 13, fontWeight: 700, lineHeight: 1.5 }}>
        Appraisal cycle for Academic Year {academicYear} is closed. The next appraisal cycle form will be available soon. For any queries, please contact appraisal@dypiu.ac.in.
      </span>
    </div>
  );
}

function NonTeachingPreviousYearReportCard({ recordFound, form, academicYear, onReport }) {
  const [zipping, setZipping] = useState(false);
  const docs = form.docs || {};
  const attachments = SELF_ITEMS.flatMap((item) => {
    const value = docs[item.key];
    const files = Array.isArray(value) ? value : value ? [value] : [];
    return files.map((file, index) => ({ ...file, particular: item.label, key: `${item.key}-${index}` }));
  });

  const selfTotals = calculateNonTeachingTotals(form, "self");

  const handleDownloadZip = async () => {
    if (zipping || !attachments.length) return;
    setZipping(true);
    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      const usedNames = new Set();
      let anyFileAdded = false;
      for (const file of attachments) {
        try {
          const response = await fetch(file.url);
          const blob = await response.blob();
          let fileName = file.name || `${file.particular}`;
          if (usedNames.has(fileName)) {
            const dotIndex = fileName.lastIndexOf(".");
            fileName = dotIndex > 0
              ? `${fileName.slice(0, dotIndex)}-${file.key}${fileName.slice(dotIndex)}`
              : `${fileName}-${file.key}`;
          }
          usedNames.add(fileName);
          zip.file(fileName, blob);
          anyFileAdded = true;
        } catch (err) {
          console.error("Could not fetch attachment for zip:", file.name, err);
        }
      }
      if (!anyFileAdded) {
        alert("Unable to download attachments right now. Please try again later.");
        return;
      }
      const content = await zip.generateAsync({ type: "blob" });
      const zipUrl = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = zipUrl;
      link.download = `Attachments_${academicYear}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(zipUrl);
    } catch (err) {
      console.error("Could not create attachments zip:", err);
      alert("Unable to create the attachments zip file.");
    } finally {
      setZipping(false);
    }
  };

  return (
    <SectionCard title={`Previous Year Appraisal Report - ${academicYear}`} accent="#4f46e5">
      {recordFound ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", padding: "12px 16px", background: "linear-gradient(135deg,#eef2ff 0%,#f5f3ff 100%)", border: "1px solid #e0e7ff", borderRadius: 10 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: "#4338ca", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 4 }}>Staff Given Score</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <span style={{ fontSize: 24, fontWeight: 900, color: "#312e81", lineHeight: 1 }}>{selfTotals.partA.toFixed(1)}</span>
                <span style={{ fontSize: 12, color: "#6366f1", fontWeight: 700 }}>/ {NON_TEACHING_MAX.partA} marks</span>
              </div>
              <div style={{ width: 160, marginTop: 6 }}>
                <ScoreBar score={selfTotals.partA} max={NON_TEACHING_MAX.partA} color="#4f46e5" />
              </div>
            </div>
            <NonTeachingStatusBadge status={form.status} />
          </div>

          <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>
            This appraisal has completed its review cycle for {academicYear}. The full breakdown - including reviewer scores, Part B ratings and remarks - is available in the generated report below.
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <button type="button" className="appraisal-submit-button" onClick={onReport} style={{ padding: "10px 22px", border: "none", borderRadius: 9, background: "#4f46e5", color: "#fff", cursor: "pointer", fontWeight: 800, fontFamily: "inherit", fontSize: 13, boxShadow: "0 8px 16px rgba(79,70,229,0.20)" }}>
              Generate Report
            </button>
            {attachments.length > 0 && (
              <button
                type="button"
                onClick={handleDownloadZip}
                disabled={zipping}
                style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 18px", border: "1.5px solid #c7d2fe", borderRadius: 9, background: zipping ? "#eef2ff" : "#fff", color: "#4338ca", fontSize: 13, fontWeight: 800, fontFamily: "inherit", cursor: zipping ? "wait" : "pointer" }}
              >
                <DocIcon />
                {zipping ? "Preparing zip..." : `Download Attachments (${attachments.length})`}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "16px 18px" }}>
          <span style={{ width: 36, height: 36, borderRadius: 10, background: "#ede9fe", color: "#6d28d9", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <DocIcon />
          </span>
          <div>
            <div style={{ fontWeight: 800, color: "#0f172a", fontSize: 14, marginBottom: 4 }}>No previous-year report available</div>
            <div style={{ color: "#4f46e5", fontWeight: 800, fontSize: 12, marginBottom: 4 }}>Academic Year: {academicYear}</div>
            <div style={{ color: "#64748b", fontSize: 12, lineHeight: 1.5 }}>We could not find a submitted previous-year appraisal report for this academic year. Please contact appraisal@dypiu.ac.in.</div>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

export function NonTeachingAppraisalForm({ role = sessionStorage.getItem("role"), embedded = false }) {
  const normalizedRole = normalizeNonTeachingRole(role, "non_teaching_staff");
  const navigate = useNavigate();
  const [form, setForm] = useState(() => emptyNonTeachingForm(profileFromsessionStorage(), normalizedRole));
  const [tab, setTab] = useState("info");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [workflow, setWorkflow] = useState(null);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState(resolveDefaultAcademicYear);
  const [availableCyclesState, setAvailableCyclesState] = useState(() => normalizeAcademicYearCycles(storedAcademicYearCycles()));
  const [recordFound, setRecordFound] = useState(true);
  const accent = roleAccent(normalizedRole);
  const statusLocked = form.status !== NON_TEACHING_STATUS.DRAFT && !isNonTeachingRejectedStatus(form.status);
  const sidebarWorkflowText = (workflow?.approvalSteps || workflow?.steps || [])
    .filter((stage) => !stage.isInitial)
    .map((stage) => stage.designation)
    .join(" to ") || "Submit your appraisal to begin the review process.";
  const academicYearOptions = availableCyclesState.length
    ? availableCyclesState
    : [{ academic_year: selectedAcademicYear, is_open: true }];
  const selectedCycle = academicYearOptions.find((cycle) => cycle.academic_year === selectedAcademicYear);
  const selectedYearIsClosed = selectedCycle ? !selectedCycle.is_open : false;
  // academicYearOptions is sorted newest-first, so index 0 is always the current cycle -
  // whichever is most recent, whether it's active or (when nothing newer exists yet) closed.
  const isLatestCycle = academicYearOptions[0]?.academic_year === selectedAcademicYear;
  // A closed cycle only becomes "historical" once it is no longer the latest cycle (i.e. a
  // newer cycle - active or itself since-closed - exists above it); the single latest cycle
  // always stays on the normal appraisal form, even while closed.
  const showAsHistorical = selectedYearIsClosed && !isLatestCycle;
  const cycleReadOnly = selectedYearIsClosed;
  const locked = statusLocked || cycleReadOnly;

  useEffect(() => {
    const syncAvailableCycles = () => {
      setAvailableCyclesState(normalizeAcademicYearCycles(storedAcademicYearCycles()));
    };
    window.addEventListener("academicYearChanged", syncAvailableCycles);
    return () => window.removeEventListener("academicYearChanged", syncAvailableCycles);
  }, []);

  const handleAcademicYearChange = (nextAcademicYear) => {
    const normalized = setActiveAcademicYear(nextAcademicYear) || nextAcademicYear;
    setSelectedAcademicYear(normalized);
    window.dispatchEvent(new CustomEvent("academicYearChanged", { detail: { academicYear: normalized } }));
  };

  useEffect(() => {
    let active = true;
    const loadForm = async () => {
      setLoading(true);
      try {
        let profile = profileFromsessionStorage();
        try {
          const latestProfile = await getMe();
          storeUserSession({ profile: latestProfile });
          profile = profileFromsessionStorage();
        } catch (profileErr) {
          console.warn("Could not refresh non-teaching profile:", profileErr?.message || profileErr);
        }
        const profileForYear = { ...profile, academic_year: selectedAcademicYear };
        const saved = await loadNonTeachingAppraisal({
          email: profile.email,
          academicYear: selectedAcademicYear,
          profile: profileForYear,
          role: normalizedRole,
        });
        const liveWorkflow = await loadNonTeachingWorkflow({
          email: profile.email,
          academicYear: selectedAcademicYear,
        }).catch(() => null);
        if (!active) return;
        // A previous-year report only counts as "available" once the staff member actually
        // submitted it - a never-touched draft row has nothing to report on or review.
        setRecordFound(Boolean(saved?.form) && saved.form.status !== NON_TEACHING_STATUS.DRAFT);
        const loadedForm = saved?.form || emptyNonTeachingForm(profileForYear, normalizedRole);
        const isEditable = !selectedYearIsClosed && (loadedForm.status === NON_TEACHING_STATUS.DRAFT || isNonTeachingRejectedStatus(loadedForm.status));
        // Non-teaching staff only: while the appraisal is still editable, keep the profile-sourced
        // General Information fields in sync with whatever was last saved via Edit Profile, so a
        // stale saved draft doesn't keep showing outdated name/employee ID/designation/department.
        if (isEditable) {
          const freshInfo = emptyNonTeachingForm(profileForYear, normalizedRole).info;
          setForm({
            ...loadedForm,
            info: {
              ...loadedForm.info,
              name: freshInfo.name || loadedForm.info?.name || "",
              employeeId: freshInfo.employeeId || loadedForm.info?.employeeId || "",
              designation: freshInfo.designation || loadedForm.info?.designation || "",
              department: freshInfo.department || loadedForm.info?.department || "",
            },
          });
        } else {
          setForm(loadedForm);
        }
        setWorkflow(liveWorkflow);
      } catch (err) {
        console.error("Could not load non-teaching appraisal:", err);
      } finally {
        if (active) setLoading(false);
      }
    };
    loadForm();
    return () => { active = false; };
  }, [normalizedRole, selectedAcademicYear, selectedYearIsClosed]);

  const updateInfo = (field, value) => {
    setForm((current) => ({ ...current, info: { ...(current.info || {}), [field]: value } }));
  };

  const updateRemarks = (value) => {
    setForm((current) => ({ ...current, remarks: value }));
  };

  const updateSummaryOtherInfo = (value) => {
    setForm((current) => ({ ...current, summaryOtherInfo: value }));
  };

  const handleSaveDraft = async () => {
    if (locked) return;
    setSavingDraft(true);
    try {
      const saved = await saveNonTeachingDraft({
        form,
        role: normalizedRole,
        profile: profileFromsessionStorage(),
      });
      setForm(saved.form);
      const liveWorkflow = await loadNonTeachingWorkflow({
        email: saved.form?.info?.email || profileFromsessionStorage().email,
        academicYear: saved.form?.info?.ay || APP_INFO.DEFAULT_AY,
      }).catch(() => null);
      setWorkflow(liveWorkflow);
      setDraftSaved(true);
    } catch (err) {
      if (err?.statusCode === 403 || err?.response?.status === 403) {
        setForm((current) => ({ ...current, status: NON_TEACHING_STATUS.SUBMITTED }));
        return;
      }
      alert(`Unable to save draft.\n\n${err.message}`);
    } finally {
      setSavingDraft(false);
    }
  };

  const handleSubmit = async () => {
    if (locked) return;
    if (!confirmed) {
      alert("Please confirm the accuracy declaration before submitting.");
      return;
    }
    const attachmentErrors = SELF_ITEMS.flatMap((item) => {
      const row = form[item.key] || {};
      const rowHasData = isFilled(row.text) || isFilled(row.marks);
      const docValue = form.docs?.[item.key];
      const files = Array.isArray(docValue) ? docValue : docValue ? [docValue] : [];
      if (!rowHasData) return [];
      if (!files.length) return [`${item.label}: attach an image or PDF.`];
      if (files.some((file) => !isAllowedAttachmentFile(file))) return [`${item.label}: attachment must be an image or PDF up to 10 MB.`];
      return [];
    });
    if (attachmentErrors.length) {
      alert(attachmentErrors.join("\n"));
      return;
    }
    try {
      validateNonTeachingForm(form, "self", false);
    } catch (err) {
      alert(err.message);
      return;
    }
    if (!window.confirm("Submit your non-teaching appraisal? It will be locked and forwarded in the hierarchy.")) return;

    setSubmitting(true);
    try {
      const saved = await submitNonTeachingSelfAppraisal({
        form,
        role: normalizedRole,
        profile: profileFromsessionStorage(),
      });
      setForm(saved.form);
      const liveWorkflow = await loadNonTeachingWorkflow({
        email: saved.form?.info?.email || profileFromsessionStorage().email,
        academicYear: saved.form?.info?.ay || APP_INFO.DEFAULT_AY,
      }).catch(() => null);
      setWorkflow(liveWorkflow);
      setConfirmed(false);
      alert("Non-teaching appraisal submitted successfully.");
    } catch (err) {
      console.error("Could not submit non-teaching appraisal:", err);
      alert(`Unable to submit appraisal.\n\n${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };
  const handleReport = () => {
    // Once the cycle being viewed is closed, the record is done and locked - the report should
    // show the complete picture (Part B + whichever authorities reviewed it and their remarks),
    // not just the self-submitted view used while the appraisal is still active/in progress.
    openNonTeachingReport({
      item: {
        name: form.info?.name,
        employeeId: form.info?.employeeId,
        designation: form.info?.designation,
        department: form.info?.department,
        appraisalRole: normalizedRole,
        status: form.status,
        academicYear: form.info?.ay,
      },
      form,
      visibleRoles: selectedYearIsClosed ? ["self", "ro", "registrar", "vc"] : ["self"],
      includePartB: selectedYearIsClosed,
    });
  };

  const content = (
    <main style={{ flex: 1, minWidth: 0, marginLeft: embedded ? 0 : 260, padding: embedded ? 0 : "22px 26px", overflowX: "auto", position: "relative" }}>
      {loading && (
        <div className="appraisal-year-loading-overlay" role="status" aria-live="polite">
          <div className="appraisal-year-loading-card">
            <div className="appraisal-year-loading-spinner" />
            <div className="appraisal-year-loading-textwrap">
              <div className="appraisal-year-loading-text">Loading {selectedAcademicYear || "academic year"} data…</div>
              <div className="appraisal-year-loading-subtext">Fetching your appraisal records</div>
              <div className="appraisal-year-loading-dots"><span /><span /><span /></div>
            </div>
          </div>
        </div>
      )}
        <>
          <div className="appraisal-page-header" style={{ background: "#fff", borderRadius: 14, padding: "16px 24px", boxShadow: "0 10px 28px rgba(17,24,39,0.06)", border: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18, flexWrap: "wrap", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <AppraisalHeaderImage logo="dypiu" height={78} />
              <div>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#0f172a", letterSpacing: 0, lineHeight: 1.1 }}>Non-Teaching Staff Appraisal</h2>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10, fontSize: 13, color: "#6b7280", fontWeight: 700, flexWrap: "wrap" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#111827", fontWeight: 800 }}>
                    <span style={{ width: 24, height: 24, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#ede9fe", color: "#6d28d9", border: "1px solid #ddd6fe" }}>
                      <PersonIcon />
                    </span>
                    <span>{form.info?.name || sessionStorage.getItem("name") || "Staff"}</span>
                  </span>
                  <span aria-hidden="true" style={{ width: 1, height: 20, background: "#cbd5e1", display: "inline-block" }} />
                  <span>Academic Year:</span>
                  <select
                    value={selectedAcademicYear}
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

          {showAsHistorical ? (
            <>
              <div style={{ marginBottom: 16 }}>
                <NonTeachingApprovalTracker workflow={workflow} />
              </div>
              <NonTeachingClosedYearNotice academicYear={selectedAcademicYear} />
              <NonTeachingPreviousYearReportCard recordFound={recordFound} form={form} academicYear={selectedAcademicYear} onReport={handleReport} />
            </>
          ) : (
          <>
          <div className="appraisal-status-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 316px", gap: 12, alignItems: "stretch", marginBottom: 16 }}>
            <NonTeachingApprovalTracker workflow={workflow} />
            <NonTeachingProgressCard totals={calculateNonTeachingTotals(form, "self")} max={NON_TEACHING_MAX} />
          </div>

          <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
            {[
              ["info", "General Information"],
              ["partA", "Part A"],
              ["summary", "Summary"],
            ].map(([id, label]) => (
              <button key={id} onClick={() => {
                setTab(id);
                requestAnimationFrame(() => {
                  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
                });
              }} style={{ border: "none", borderRadius: 7, padding: "8px 16px", background: tab === id ? accent : "#e2e8f0", color: tab === id ? "#fff" : "#475569", fontFamily: "inherit", fontWeight: 800, cursor: "pointer", fontSize: 12 }}>
                {label}
              </button>
            ))}
          </div>

          <RejectionNotice
            form={form}
            status={form.status}
            alertOnceKey={`${form.info?.email || profileFromsessionStorage().email}:${form.info?.ay || APP_INFO.DEFAULT_AY}:${form.status || ""}`}
          />

          {tab === "info" && (
            <SectionCard title="General Information" accent={accent}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
                {[
                  ["Name", "name"],
                  ["Employee ID", "employeeId"],
                  ["Designation", "designation"],
                  ["Department / Office", "department"],
                  ["Reporting Head", "reportingHead"],
                ].map(([label, key]) => (
                  <label key={key} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <span style={{ color: "#334155", fontSize: 11, fontWeight: 800 }}>{label}</span>
                    <TextInput value={form.info?.[key]} onChange={(value) => updateInfo(key, value)} readOnly={key === "reportingHead" ? cycleReadOnly : locked} />
                  </label>
                ))}
                <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <span style={{ color: "#334155", fontSize: 11, fontWeight: 800 }}>Academic Year</span>
                  <select
                    value={selectedAcademicYear}
                    onChange={(event) => handleAcademicYearChange(event.target.value)}
                    className="appraisal-year-select"
                    style={{ width: "100%", boxSizing: "border-box", height: 34, border: "1px solid #cbd5e1", borderRadius: 6, padding: "6px 9px", fontSize: 12, fontFamily: "inherit", outline: "none", background: "#fff", color: "#0f172a" }}
                  >
                    {academicYearOptions.map((cycle) => (
                      <option key={cycle.academic_year} value={cycle.academic_year}>
                        {cycle.academic_year} {cycle.is_open ? "(Active)" : "(Closed / Read-Only)"}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </SectionCard>
          )}

          {tab === "partA" && <SelfAppraisalTable form={form} setForm={setForm} readOnly={locked} accent={accent} />}
          {(tab === "info" || tab === "partA") && !locked && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "12px 14px", border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff" }}>
              <span style={{ color: draftSaved ? "#047857" : "#64748b", fontSize: 12, fontWeight: 800 }}>
                {draftSaved ? "Draft saved to server." : "Save this section draft to server."}
              </span>
              <button type="button" onClick={handleSaveDraft} disabled={savingDraft} style={{ ...S.headerButton, background: savingDraft ? "#94a3b8" : accent, color: "#fff", border: "none", cursor: savingDraft ? "wait" : "pointer" }}>
                {savingDraft ? "Saving..." : `Save ${tab === "info" ? "General Information" : "Part A"}`}
              </button>
            </div>
          )}
          {tab === "summary" && (
            <SummaryPanel
              form={form}
              role={normalizedRole}
              onSubmit={handleSubmit}
              onUpdateRemarks={updateRemarks}
              onUpdateSummaryOtherInfo={updateSummaryOtherInfo}
              onReport={handleReport}
              submitting={submitting}
              locked={locked}
              confirmed={confirmed}
              setConfirmed={setConfirmed}
              accent={accent}
              showReport={normalizedRole !== "registrar"}
            />
          )}
          </>
          )}
        </>
    </main>
  );

  if (embedded) return content;

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "#f1f5f9", fontFamily: "inherit", color: "#0f172a" }}>
      <aside className="appraisal-sidebar" style={{ width: 260, height: "100vh", position: "fixed", left: 0, top: 0, zIndex: 20, boxSizing: "border-box", background: "linear-gradient(180deg,#111827 0%,#111827 54%,#0f172a 100%)", padding: "18px 14px 110px", color: "#e2e8f0", display: "flex", flexDirection: "column", gap: 12, borderRight: "1px solid rgba(148,163,184,0.14)", boxShadow: "10px 0 28px rgba(15,23,42,0.20)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 1px 3px" }}>
          <div style={{ width: 42, height: 42, borderRadius: 13, background: "linear-gradient(135deg,#6366f1 0%,#4338ca 100%)", border: "1px solid rgba(199,210,254,0.35)", display: "flex", alignItems: "center", justifyContent: "center", color: "#f8fafc", fontWeight: 900, fontSize: 13, boxShadow: "0 10px 22px rgba(79,70,229,0.38), 0 0 0 3px rgba(99,102,241,0.10)" }}>NT</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: "#f8fafc", fontWeight: 900, fontSize: 13, lineHeight: 1.15 }}>{APP_INFO.PORTAL_NAME}</div>
            <div style={{ color: "#94a3b8", fontSize: 10, lineHeight: 1.3, marginTop: 3 }}>{APP_INFO.UNIVERSITY_NAME}</div>
          </div>
        </div>
        <div style={{ height: 1, background: "rgba(148,163,184,0.16)" }} />
        <div style={{ background: "rgba(30,41,59,0.72)", border: "1px solid rgba(148,163,184,0.16)", borderRadius: 14, padding: "11px 12px", fontSize: 11, color: "#94a3b8", lineHeight: 1.6 }}>
          {sidebarWorkflowText}
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ height: 1, background: "rgba(148,163,184,0.16)" }} />
        <button
          type="button"
          onClick={() => navigate("/edit-profile")}
          title="Edit profile"
          style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.055)", border: "1px solid rgba(148,163,184,0.16)", borderRadius: 16, padding: 10, width: "100%", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}
        >
          <Avatar
            initials={initials(sessionStorage.getItem("name") || "Staff")}
            src={sessionStorage.getItem("profilePictureUrl") || sessionStorage.getItem("profile_picture_url") || sessionStorage.getItem("avatarUrl") || ""}
            color={accent}
            size={42}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 13 }}>{sessionStorage.getItem("name") || "Staff"}</div>
            <div style={{ color: "#94a3b8", fontSize: 10 }}>{nonTeachingRoleLabel(normalizedRole)}</div>
          </div>
          <ProfileNavIcon />
        </button>
        <div style={{ margin: "4px 0", padding: "11px 12px", background: "rgba(30,41,59,0.62)", border: "1px solid rgba(148,163,184,0.18)", borderRadius: 16 }}>
          <div style={{ color: "#94a3b8", fontWeight: 700, fontSize: 9, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4 }}>For any queries</div>
          <a href="mailto:appraisal@dypiu.ac.in" style={{ color: "#c7d2fe", fontWeight: 700, fontSize: 11, wordBreak: "break-all", textDecoration: "none" }}>appraisal@dypiu.ac.in</a>
        </div>
        <div style={S.sideActions}>
          <button type="button" onClick={() => setShowLogoutModal(true)} style={S.sideButton}>
            <LogoutButtonIcon />
            <span>Logout</span>
          </button>
        </div>
      </aside>
      {content}
      {showLogoutModal && <LogoutConfirmModal portalName={APP_INFO.PORTAL_NAME} onCancel={() => setShowLogoutModal(false)} onConfirm={() => { clearUserSession(); navigate("/login", { replace: true }); }} />}
    </div>
  );
}

function AuthorityPartA({ form, setForm, reviewerRole, readOnly, visibleRoles = [] }) {
  const role = normalizeNonTeachingRole(reviewerRole, reviewerRole);
  const editableKey = role === "vc" ? "vcMarks" : role === "registrar" ? "regMarks" : "roMarks";
  const accent = roleAccent(role);
  const showReportingOfficer = hasVisibleReviewRole(visibleRoles, "ro");
  const showRegistrar = hasVisibleReviewRole(visibleRoles, "registrar");
  const showVc = hasVisibleReviewRole(visibleRoles, "vc");
  const reportingOfficerLabel = workflowDesignationForNonTeachingRole(form, "reporting_officer");
  const registrarLabel = workflowDesignationForNonTeachingRole(form, "registrar");
  const vcLabel = workflowDesignationForNonTeachingRole(form, "vc");
  const setMark = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: { ...(current[key] || {}), [editableKey]: value },
    }));
  };

  return (
    <SectionCard title="Part A - Self Appraisal Review" accent={accent}>
      <div style={{ overflowX: "auto" }}>
        <table style={T}>
          <thead>
            <tr>
              <th style={{ ...TH, textAlign: "left" }}>Particular</th>
              <th style={{ ...TH, textAlign: "left" }}>Staff Description</th>
              <th style={TH}>Docs</th>
              <th style={TH}>Self</th>
              {showReportingOfficer && <th style={TH}>{reportingOfficerLabel}</th>}
              {showRegistrar && <th style={TH}>{registrarLabel}</th>}
              {showVc && <th style={TH}>{vcLabel}</th>}
            </tr>
          </thead>
          <tbody>
            {SELF_ITEMS.map((item, index) => (
              <tr key={item.key} style={index % 2 ? { background: "#f8fafc" } : undefined}>
                <td style={{ ...TD, minWidth: 160, fontWeight: 800 }}>{item.label}<div style={{ color: "#64748b", fontSize: 10, fontWeight: 500 }}>Max {item.max}</div></td>
                <td style={{ ...TD, minWidth: 260 }}>{form[item.key]?.text || <span style={{ color: "#94a3b8" }}>No description</span>}</td>
                <td style={{ ...TD, minWidth: 180 }}><DocCell id={item.key} docs={form.docs || {}} readOnly /></td>
                <td style={TDC}>{form[item.key]?.marks || "-"}</td>
                {showReportingOfficer && (
                  <td style={TDC}>
                    {role === "reporting_officer" ? (
                      <MarksInput value={form[item.key]?.roMarks} max={item.max} readOnly={readOnly} accent={accent} onChange={(value) => setMark(item.key, value)} />
                    ) : form[item.key]?.roMarks || "-"}
                  </td>
                )}
                {showRegistrar && (
                  <td style={TDC}>
                    {role === "registrar" ? (
                      <MarksInput value={form[item.key]?.regMarks} max={item.max} readOnly={readOnly} accent={accent} onChange={(value) => setMark(item.key, value)} />
                    ) : form[item.key]?.regMarks || "-"}
                  </td>
                )}
                {showVc && (
                  <td style={TDC}>
                    {role === "vc" ? (
                      <MarksInput value={form[item.key]?.vcMarks} max={item.max} readOnly={readOnly} accent={accent} onChange={(value) => setMark(item.key, value)} />
                    ) : form[item.key]?.vcMarks || "-"}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

function AuthorityPartB({ form, setForm, reviewerRole, readOnly, visibleRoles = [] }) {
  const role = normalizeNonTeachingRole(reviewerRole, reviewerRole);
  const suffix = role === "vc" ? "vc" : role === "registrar" ? "reg" : "ro";
  const showReportingOfficer = hasVisibleReviewRole(visibleRoles, "ro");
  const showRegistrar = hasVisibleReviewRole(visibleRoles, "registrar");
  const showVc = hasVisibleReviewRole(visibleRoles, "vc");
  const reportingOfficerLabel = workflowDesignationForNonTeachingRole(form, "reporting_officer");
  const registrarLabel = workflowDesignationForNonTeachingRole(form, "registrar");
  const vcLabel = workflowDesignationForNonTeachingRole(form, "vc");
  const setRating = (sectionKey, index, value) => {
    setForm((current) => ({
      ...current,
      partB: {
        ...(current.partB || {}),
        [sectionKey]: {
          ...(current.partB?.[sectionKey] || {}),
          [`p${index}_${suffix}`]: value,
        },
      },
    }));
  };

  return (
    <>
      {RATING_SECTIONS.map((section) => (
        <SectionCard key={section.key} title={section.title} subtitle={`Max ${section.max} marks`} accent={section.accent}>
          <div style={{ overflowX: "auto" }}>
            <table style={T}>
              <thead>
                <tr>
                  <th style={TH}>SN</th>
                  <th style={{ ...TH, textAlign: "left" }}>Parameter</th>
                  {showReportingOfficer && <th style={TH}>{reportingOfficerLabel}</th>}
                  {showRegistrar && <th style={TH}>{registrarLabel}</th>}
                  {showVc && <th style={TH}>{vcLabel}</th>}
                </tr>
              </thead>
              <tbody>
                {section.params.map((param, index) => {
                  const row = form.partB?.[section.key] || {};
                  return (
                    <tr key={param} style={index % 2 ? { background: "#f8fafc" } : undefined}>
                      <td style={TDC}>{index + 1}</td>
                      <td style={TD}>{param}</td>
                      {showReportingOfficer && (
                        <td style={TDC}>
                          {role === "reporting_officer" ? (
                            <RatingPicker value={row[`p${index}_ro`]} readOnly={readOnly} onChange={(value) => setRating(section.key, index, value)} />
                          ) : row[`p${index}_ro`] || "-"}
                        </td>
                      )}
                      {showRegistrar && (
                        <td style={TDC}>
                          {role === "registrar" ? (
                            <RatingPicker value={row[`p${index}_reg`]} readOnly={readOnly} onChange={(value) => setRating(section.key, index, value)} />
                          ) : row[`p${index}_reg`] || "-"}
                        </td>
                      )}
                      {showVc && (
                        <td style={TDC}>
                          {role === "vc" ? (
                            <RatingPicker value={row[`p${index}_vc`]} readOnly={readOnly} onChange={(value) => setRating(section.key, index, value)} />
                          ) : row[`p${index}_vc`] || "-"}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SectionCard>
      ))}
    </>
  );
}

export function NonTeachingAuthorityReviewPanel({ item, reviewerRole, onBack, onSubmitted, readOnly = false }) {
  const role = normalizeNonTeachingRole(reviewerRole, reviewerRole);
  const [form, setForm] = useState(() => primeFormForReviewer(item.form, role));
  const [tab, setTab] = useState("partA");
  const [remarks, setRemarks] = useState(role === "vc" ? item.form?.vcRemarks : role === "registrar" ? item.form?.registrarRemarks : item.form?.roRemarks);
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftStatus, setDraftStatus] = useState("");
  const [workflow, setWorkflow] = useState(item.workflow || null);
  const reviewApproved = isCurrentNonTeachingReviewApproved(item, role);
  const locked = readOnly || reviewApproved;
  const accent = roleAccent(role);
  const subjectEmail = item.email || item.staff_email || form.info?.email;
  const academicYear = item.academicYear || item.academic_year || form.info?.ay || APP_INFO.DEFAULT_AY;
  useEffect(() => {
    let active = true;
    loadNonTeachingWorkflow({
      email: item.email || item.staff_email,
      academicYear: item.academicYear || item.academic_year || form.info?.ay || APP_INFO.DEFAULT_AY,
    })
      .then((liveWorkflow) => {
        if (active) setWorkflow(liveWorkflow);
      })
      .catch(() => {
        if (active) setWorkflow(item.workflow || emptyWorkflow);
      });
    return () => { active = false; };
  }, [item, form.info?.ay]);
  const displayWorkflow = workflow || emptyWorkflow;
  const workflowForVisibility = displayWorkflow?.approvalSteps?.length ? displayWorkflow : null;
  const visibleRoles = visibleNonTeachingReviewRoles(role, { ...item, workflow: workflowForVisibility });
  const reviewerDesignation = workflowDesignationForNonTeachingRole({ ...item, form, workflow: displayWorkflow }, role);
  const selfTotals = calculateNonTeachingTotals(form, "self");
  const totals = calculateNonTeachingTotals(form, role === "vc" ? "vc" : role);
  const authorityScoreLabel = role === "vc" ? "Vice Chancellor Score" : `${reviewerDesignation} Score`;
  const remarksLabel = role === "vc" ? "Vice Chancellor Remarks and Grade" : `${reviewerDesignation} Remarks`;
  useEffect(() => {
    let active = true;
    if (locked || !subjectEmail) return undefined;
    loadReviewerDraft({ subjectEmail, academicYear, reviewerRole: role })
      .then((draft) => {
        if (!active || !draft?.payload) return;
        const draftForm = draft.payload.form || draft.payload.section_scores;
        if (draftForm) setForm(primeFormForReviewer(draftForm, role));
        setRemarks(draft.payload.remarks ?? "");
        setDraftStatus(draft.updated_at ? `Last saved: ${new Date(draft.updated_at).toLocaleString()}` : "Draft loaded");
      })
      .catch((err) => {
        if (!active) return;
        console.error("Could not load non-teaching reviewer draft:", err);
        setDraftStatus(err?.message || "Could not load draft.");
      });
    return () => { active = false; };
  }, [academicYear, locked, role, subjectEmail]);

  const buildDraftForm = () => ({
    ...form,
    roRemarks: role === "reporting_officer" ? remarks : form.roRemarks,
    registrarRemarks: role === "registrar" ? remarks : form.registrarRemarks,
    vcRemarks: role === "vc" ? remarks : form.vcRemarks,
  });

  const handleSaveDraft = async () => {
    try {
      setSavingDraft(true);
      const draftForm = buildDraftForm();
      await saveReviewerDraft({
        subjectEmail,
        academicYear,
        reviewerRole: role,
        payload: {
          part_a_score: totals.partA,
          part_b_score: totals.partB,
          total_score: totals.total,
          remarks,
          section_scores: draftForm,
          form: draftForm,
        },
      });
      setDraftStatus(`Draft saved: ${new Date().toLocaleString()}`);
    } catch (err) {
      console.error("Could not save non-teaching reviewer draft:", err);
      alert(err?.message || "Unable to save draft.");
    } finally {
      setSavingDraft(false);
    }
  };

  const handleSaveAndNext = async () => {
    await handleSaveDraft();
    const NEXT_NON_TEACHING_TAB = { partA: "partB", partB: "remarks" };
    const nextTab = NEXT_NON_TEACHING_TAB[tab];
    if (nextTab) {
      setTab(nextTab);
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
      });
    }
  };

  const handleReject = async () => {
    if (!confirmed) {
      alert("Please verify and confirm the declaration before rejecting.");
      return;
    }
    if (!remarks?.trim()) {
      alert("Remarks are mandatory when rejecting. Please enter your remarks before rejecting.");
      return;
    }
    if (!window.confirm(`Reject this appraisal and send it back to ${item.name} for editing?`)) return;

    setSubmitting(true);
    try {
      const updated = await submitNonTeachingReview({
        item,
        form,
        reviewerRole: role,
        remarks,
        decision: "rejected",
      });
      alert(`${reviewerDesignation} review submitted (Rejected).`);
      onSubmitted?.(updated);
    } catch (err) {
      console.error("Could not reject non-teaching review:", err);
      alert(`Unable to reject review.\n\n${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!confirmed) {
      alert("Please verify and confirm the accuracy declaration before submitting the review.");
      return;
    }
    if (!remarks?.trim()) {
      alert("Remarks are mandatory. Please enter your remarks before submitting the review.");
      return;
    }
    try {
      validateNonTeachingForm(form, role === "vc" ? "vc" : role, true);
    } catch (err) {
      alert(err.message);
      return;
    }
    if (!window.confirm(`Submit ${reviewerDesignation} review?`)) return;

    setSubmitting(true);
    try {
      const updated = await submitNonTeachingReview({
        item,
        form,
        reviewerRole: role,
        remarks,
      });
      alert(`${reviewerDesignation} review submitted.`);
      onSubmitted?.(updated);
    } catch (err) {
      console.error("Could not submit non-teaching review:", err);
      alert(`Unable to submit review.\n\n${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReport = () => {
    openNonTeachingReport({
      item,
      form: {
        ...form,
        roRemarks: role === "reporting_officer" ? remarks : form.roRemarks,
        registrarRemarks: role === "registrar" ? remarks : form.registrarRemarks,
        vcRemarks: role === "vc" ? remarks : form.vcRemarks,
      },
      visibleRoles,
    });
  };

  return (
    <div>
      <div style={{ background: "#0f172a", borderRadius: 10, padding: "14px 18px", marginBottom: 14, display: "flex", alignItems: "center", gap: 12 }}>
        <button type="button" onClick={onBack} style={{ background: "#1e293b", color: "#cbd5e1", border: "none", borderRadius: 6, padding: "7px 12px", cursor: "pointer", fontFamily: "inherit" }}>Back</button>
        <Avatar initials={initials(item.name)} src={item.avatarUrl} color={item.avatarColor || accent} size={50} />
        <div style={{ flex: 1 }}>
          <div style={{ color: "#f8fafc", fontSize: 15, fontWeight: 800 }}>{item.name}</div>
          <div style={{ color: "#94a3b8", fontSize: 11 }}>{item.roleLabel} | {item.designation} | {item.employeeId}</div>
        </div>
        <div style={{ background: "#1e293b", borderRadius: 8, padding: "8px 12px", color: "#e2e8f0", textAlign: "center" }}>
          <div style={{ color: "#94a3b8", fontSize: 9, fontWeight: 800, textTransform: "uppercase" }}>{reviewerDesignation} Total</div>
          <div style={{ color: accent, fontWeight: 900, fontSize: 16 }}>{totals.total.toFixed(1)}</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {[
          ["partA", "Part A"],
          ["partB", "Part B"],
          ["remarks", "Summary"],
        ].map(([id, label]) => (
          <button key={id} type="button" onClick={() => {
            setTab(id);
            requestAnimationFrame(() => {
              window.scrollTo({ top: 0, left: 0, behavior: "auto" });
            });
          }} style={{ border: "none", borderRadius: 7, padding: "8px 16px", background: tab === id ? accent : "#e2e8f0", color: tab === id ? "#fff" : "#475569", cursor: "pointer", fontFamily: "inherit", fontWeight: 800 }}>
            {label}
          </button>
        ))}
      </div>

      <fieldset disabled={locked} style={{ border: "none", padding: 0, margin: 0 }}>
        {tab === "partA" && <AuthorityPartA form={form} setForm={setForm} reviewerRole={role} readOnly={locked} visibleRoles={visibleRoles} />}
        {tab === "partB" && <AuthorityPartB form={form} setForm={setForm} reviewerRole={role} readOnly={locked} visibleRoles={visibleRoles} />}
      </fieldset>
      {(tab === "partA" || tab === "partB") && !locked && (
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 10, margin: "12px 0 14px", flexWrap: "wrap" }}>
          <span style={{ color: "#64748b", fontSize: 11, fontWeight: 800 }}>{draftStatus}</span>
          <button type="button" onClick={handleSaveDraft} disabled={savingDraft} style={{ padding: "10px 24px", border: "1.5px solid #2563eb", borderRadius: 10, background: "#fff", color: savingDraft ? "#94a3b8" : "#2563eb", cursor: savingDraft ? "not-allowed" : "pointer", fontWeight: 800, fontFamily: "inherit" }}>
            {savingDraft ? "Saving..." : "Save as Draft"}
          </button>
          <button type="button" onClick={handleSaveAndNext} disabled={savingDraft} style={{ padding: "10px 24px", border: "none", borderRadius: 10, background: savingDraft ? "#94a3b8" : "#2563eb", color: "#fff", cursor: savingDraft ? "not-allowed" : "pointer", fontWeight: 800, fontFamily: "inherit" }}>
            {savingDraft ? "Saving..." : "Save & Next"}
          </button>
        </div>
      )}

      {tab === "remarks" && (
        <SectionCard title={locked ? "Submitted Review" : `${reviewerDesignation} Remarks & Submission`} accent={accent}>
          {role === "vc" && hasVisibleReviewRole(visibleRoles, "ro") && form.roRemarks && <PriorRemark label={`${workflowDesignationForNonTeachingRole({ ...item, form }, "reporting_officer")} Remarks`} value={form.roRemarks} color={ACCENT} />}
          {role === "vc" && hasVisibleReviewRole(visibleRoles, "registrar") && form.registrarRemarks && <PriorRemark label={`${workflowDesignationForNonTeachingRole({ ...item, form }, "registrar")} Remarks`} value={form.registrarRemarks} color={REG_ACCENT} />}

          <div>
            <div style={{ color: "#334155", fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>Staff Submitted Score</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
              {[
                ["Part A", selfTotals.partA, NON_TEACHING_MAX.partA],
                ["Part B", selfTotals.partB, NON_TEACHING_MAX.partB],
                ["Grand Total", selfTotals.total, NON_TEACHING_MAX.grand],
              ].map(([label, value, max]) => (
                <div key={label} style={{ border: "1px solid #dbe3ef", borderRadius: 10, background: "#f8fafc", padding: "10px 12px", boxShadow: "0 8px 18px rgba(15,23,42,0.03)" }}>
                  <div style={{ color: "#64748b", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</div>
                  <div style={{ color: "#1d4ed8", fontSize: 18, fontWeight: 900, margin: "4px 0" }}>{n(value).toFixed(1)} / {max}</div>
                  <ScoreBar score={value} max={max} color="#1d4ed8" />
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ color: "#334155", fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>{authorityScoreLabel}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
              {[
                ["Part A", totals.partA, NON_TEACHING_MAX.partA],
                ["Part B", totals.partB, NON_TEACHING_MAX.partB],
                ["Grand Total", totals.total, NON_TEACHING_MAX.grand],
              ].map(([label, value, max]) => (
                <div key={label} style={{ border: "1px solid #dbe3ef", borderRadius: 10, background: "#f8fafc", padding: "10px 12px", boxShadow: "0 8px 18px rgba(15,23,42,0.03)" }}>
                  <div style={{ color: "#64748b", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</div>
                  <div style={{ color: accent, fontSize: 18, fontWeight: 900, margin: "4px 0" }}>{n(value).toFixed(1)} / {max}</div>
                  <ScoreBar score={value} max={max} color={accent} />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, color: "#334155", fontWeight: 800, display: "block", marginBottom: 6 }}>{remarksLabel}</label>
            <TextArea value={remarks} onChange={setRemarks} readOnly={locked} rows={7} placeholder="Enter review remarks and recommendations..." />
          </div>

          {!locked && (
            <label className="appraisal-confirmation-card" style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "11px 12px", background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10, fontSize: 12, color: "#334155", lineHeight: 1.5 }}>
              <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} style={{ marginTop: 3, accentColor: "#16a34a" }} />
              <span>I have verified all details and confirm that this review is accurate.</span>
            </label>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ color: "#64748b", fontSize: 11, fontWeight: 800 }}>{draftStatus}</span>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}>
            <button type="button" onClick={onBack} style={{ padding: "9px 18px", border: "none", borderRadius: 10, background: "#f1f5f9", color: "#475569", cursor: "pointer", fontWeight: 800, fontFamily: "inherit" }}>{locked ? "Close" : "Cancel"}</button>
            {role === "vc" && locked && (
              <button type="button" className="appraisal-report-button" onClick={handleReport} style={{ padding: "9px 18px", border: "none", borderRadius: 10, background: "#e2e8f0", color: "#475569", cursor: "pointer", fontWeight: 800, fontFamily: "inherit" }}>Generate Report</button>
            )}
            {!locked && (
              <>
              <button type="button" onClick={handleSaveDraft} disabled={savingDraft} style={{ padding: "10px 24px", border: "none", borderRadius: 10, background: savingDraft ? "#94a3b8" : "#2563eb", color: "#fff", cursor: savingDraft ? "not-allowed" : "pointer", fontWeight: 800, fontFamily: "inherit" }}>
                {savingDraft ? "Saving..." : "Save Draft"}
              </button>
              <button type="button" className="appraisal-danger-button" onClick={handleReject} disabled={!confirmed || !remarks.trim() || submitting} style={{ padding: "10px 24px", border: "none", borderRadius: 10, background: (confirmed && remarks.trim()) ? "#dc2626" : "#94a3b8", color: "#fff", cursor: confirmed && remarks.trim() && !submitting ? "pointer" : "not-allowed", fontWeight: 800, fontFamily: "inherit" }}>
                Reject Form
              </button>
              <button type="button" className="appraisal-submit-button" onClick={handleSubmit} disabled={!confirmed || !remarks.trim() || submitting} style={{ padding: "10px 24px", border: "none", borderRadius: 10, background: (confirmed && remarks.trim()) ? accent : "#94a3b8", color: "#fff", cursor: confirmed && remarks.trim() && !submitting ? "pointer" : "not-allowed", fontWeight: 800, fontFamily: "inherit" }}>
                {submitting ? "Submitting..." : "Submit"}
              </button>
              </>
            )}
            </div>
          </div>
        </SectionCard>
      )}
    </div>
  );
}

function PriorRemark({ label, value, color }) {
  return (
    <div style={{ background: `${color}12`, border: `1px solid ${color}35`, borderLeft: `3px solid ${color}`, borderRadius: 8, padding: "10px 12px", marginBottom: 10 }}>
      <div style={{ color, fontSize: 10, textTransform: "uppercase", fontWeight: 900, marginBottom: 4 }}>{label}</div>
      <div style={{ color: "#334155", fontSize: 12, lineHeight: 1.6 }}>{value}</div>
    </div>
  );
}

function NonTeachingStatusBadge({ status }) {
  const text = status || "Draft";
  const lower = text.toLowerCase();
  const tone = lower.includes("rejected")
    ? { bg: "#fee2e2", color: "#991b1b", dot: "#dc2626" }
    : lower.includes("approved")
      ? { bg: "#d1fae5", color: "#065f46", dot: "#10b981" }
      : lower.includes("reviewed")
        ? { bg: "#dbeafe", color: "#1e40af", dot: "#3b82f6" }
        : lower.includes("pending")
          ? { bg: "#fef3c7", color: "#92400e", dot: "#f59e0b" }
          : { bg: "#f1f5f9", color: "#475569", dot: "#94a3b8" };
  return (
    <span className="pbas-badge" style={{ background: tone.bg, color: tone.color }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: tone.dot, display: "inline-block" }} />
      {text}
    </span>
  );
}

function NonTeachingReviewCard({ item, reviewerRole, onOpen }) {
  const role = normalizeNonTeachingRole(reviewerRole, reviewerRole);
  const reviewed = isCurrentNonTeachingReviewApproved(item, role);
  const selfTotals = calculateNonTeachingTotals(item.form, "self");
  const authorityTotals = calculateNonTeachingTotals(item.form, role === "vc" ? "vc" : role);
  const showAuthorityScores = reviewed && (authorityTotals.partA > 0 || authorityTotals.partB > 0 || authorityTotals.total > 0);
  const metricsTotals = showAuthorityScores ? authorityTotals : selfTotals;
  const prefix = showAuthorityScores ? (role === "vc" ? "VC " : role === "registrar" ? "Reg " : "RO ") : "";
  const metrics = [
    { label: `${prefix}Part A`, val: metricsTotals.partA, max: NON_TEACHING_MAX.partA, color: "#6366f1" },
    { label: `${prefix}Part B`, val: metricsTotals.partB, max: NON_TEACHING_MAX.partB, color: "#0ea5e9" },
    { label: `${prefix}Total`, val: metricsTotals.total, max: NON_TEACHING_MAX.grand, color: "#4338ca" },
  ];
  const submittedOn = item.submittedOn || (item.submitted_at ? new Date(item.submitted_at).toLocaleDateString() : "");

  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: "18px 20px", boxShadow: "0 1px 6px rgba(0,0,0,.07)", display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <Avatar initials={initials(item.name)} src={item.avatarUrl} color={item.avatarColor || ACCENT} size={58} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 2 }}>{item.name}</div>
          <div style={{ fontSize: 11, color: "#475569", marginBottom: 2 }}>{item.designation}</div>
          <div style={{ fontSize: 10, color: "#94a3b8", fontFamily: "monospace" }}>{item.employeeId}</div>
        </div>
        <NonTeachingStatusBadge status={item.status} />
      </div>

      <ReviewMetricsStrip metrics={metrics} docs={item.form?.docs} item={item} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f1f5f9", paddingTop: 12 }}>
        <div style={{ fontSize: 10, color: "#94a3b8" }}>Submitted: {submittedOn || "-"}</div>
        <button type="button" onClick={onOpen} style={{ fontSize: 11, padding: "7px 18px", background: reviewed ? "#1e293b" : "#312e81", color: "#f1f5f9", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 700, fontFamily: "inherit" }}>
          {reviewed ? "View Review" : "Review Form"}
        </button>
      </div>
    </div>
  );
}

export function NonTeachingReviewDashboard({ reviewerRole, title, subtitle, accent = ACCENT }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState("review");
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState(resolveDefaultAcademicYear);
  const [availableCyclesState, setAvailableCyclesState] = useState(() => normalizeAcademicYearCycles(storedAcademicYearCycles()));
  const academicYearOptions = availableCyclesState.length
    ? availableCyclesState
    : [{ academic_year: selectedAcademicYear, is_open: true }];

  const handleAcademicYearChange = (nextAcademicYear) => {
    const normalized = setActiveAcademicYear(nextAcademicYear) || nextAcademicYear;
    setSelectedAcademicYear(normalized);
    setSelectedId("");
    window.dispatchEvent(new CustomEvent("academicYearChanged", { detail: { academicYear: normalized } }));
  };

  useEffect(() => {
    const syncAcademicYear = (event) => {
      setAvailableCyclesState(normalizeAcademicYearCycles(storedAcademicYearCycles()));
      if (event?.detail?.academicYear) setSelectedAcademicYear(event.detail.academicYear);
    };
    window.addEventListener("academicYearChanged", syncAcademicYear);
    return () => window.removeEventListener("academicYearChanged", syncAcademicYear);
  }, []);

  const loadQueue = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const queue = await fetchNonTeachingQueueForRole({
        reviewerRole,
        academicYear: selectedAcademicYear,
      });
      setItems(queue);
      if (selectedId && !queue.some((item) => item.id === selectedId)) {
        setSelectedId("");
      }
    } catch (err) {
      console.error("Could not load non-teaching queue:", err);
      setLoadError(err.message || "Could not load non-teaching review queue.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(loadQueue, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewerRole, selectedAcademicYear]);

  const selected = items.find((item) => item.id === selectedId);
  const normalizedReviewerRole = normalizeNonTeachingRole(reviewerRole, reviewerRole);
  const reviewedCount = items.filter((item) => isCurrentNonTeachingReviewApproved(item, normalizedReviewerRole)).length;
  const pendingCount = items.length - reviewedCount;

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "#f1f5f9", color: "#0f172a", fontFamily: "inherit" }}>
      <aside className="appraisal-sidebar" style={{ width: 260, height: "100vh", position: "fixed", left: 0, top: 0, zIndex: 20, boxSizing: "border-box", background: "linear-gradient(180deg,#111827 0%,#111827 54%,#0f172a 100%)", color: "#e2e8f0", display: "flex", flexDirection: "column", padding: "18px 14px 86px", gap: 12, borderRight: "1px solid rgba(148,163,184,0.14)", boxShadow: "10px 0 28px rgba(15,23,42,0.20)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 1px 3px" }}>
          <div style={{ width: 42, height: 42, borderRadius: 13, background: "linear-gradient(135deg,#6366f1 0%,#4338ca 100%)", border: "1px solid rgba(199,210,254,0.35)", display: "flex", alignItems: "center", justifyContent: "center", color: "#f8fafc", fontWeight: 900, fontSize: 13, boxShadow: "0 10px 22px rgba(79,70,229,0.38), 0 0 0 3px rgba(99,102,241,0.10)" }}>NT</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: "#f8fafc", fontWeight: 900, fontSize: 13, lineHeight: 1.15 }}>{APP_INFO.PORTAL_NAME}</div>
            <div style={{ color: "#94a3b8", fontSize: 10, lineHeight: 1.3, marginTop: 3 }}>{APP_INFO.UNIVERSITY_NAME}</div>
          </div>
        </div>
        <div style={{ height: 1, background: "rgba(148,163,184,0.16)" }} />

        <nav style={{ display: "grid", gap: 7 }} aria-label="Dashboard sections">
          {[
            { id: "self", label: "My Staff Appraisal", sub: "View your self-appraisal form", icon: <SelfNavIcon /> },
            { id: "review", label: "Non Teaching Approval", sub: `${pendingCount} awaiting review`, icon: <ReviewNavIcon />, badge: pendingCount },
          ].map((navItem) => {
            const isActive = tab === navItem.id;
            return (
              <button
                key={navItem.id}
                type="button"
                className={isActive ? "is-active" : ""}
                onClick={() => {
                  setTab(navItem.id);
                  requestAnimationFrame(() => {
                    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
                  });
                }}
                style={{ background: isActive ? "#f8fafc" : "transparent", border: isActive ? "1px solid #f8fafc" : "1px solid transparent", borderRadius: 8, padding: "10px 11px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, width: "100%", fontFamily: "inherit", boxShadow: isActive ? "0 10px 24px rgba(0,0,0,0.30)" : "none" }}
              >
                <span style={{ width: 28, height: 28, borderRadius: 7, background: isActive ? "rgba(15,23,42,0.07)" : "rgba(148,163,184,0.14)", color: isActive ? "#0f172a" : "#94a3b8", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {navItem.icon}
                </span>
                <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                  <div style={{ color: isActive ? "#0f172a" : "#e2e8f0", fontWeight: 700, fontSize: 12.5, lineHeight: 1.1 }}>{navItem.label}</div>
                  <div style={{ color: isActive ? "#475569" : "#94a3b8", fontSize: 10.5, marginTop: 3, lineHeight: 1.3 }}>{navItem.sub}</div>
                </div>
                {navItem.badge > 0 && (
                  <div style={{ background: isActive ? "#0f172a" : "rgba(148,163,184,0.15)", color: isActive ? "#f8fafc" : "#cbd5e1", fontWeight: 700, fontSize: 10, minWidth: 18, height: 18, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px", flexShrink: 0 }}>{navItem.badge}</div>
                )}
              </button>
            );
          })}
        </nav>

        <div style={{ flex: 1 }} />
        <div style={{ height: 1, background: "rgba(148,163,184,0.16)" }} />

        <button
          type="button"
          onClick={() => navigate("/edit-profile")}
          title="Edit profile"
          style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.055)", border: "1px solid rgba(148,163,184,0.16)", borderRadius: 16, padding: 10, width: "100%", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}
        >
          <Avatar
            initials={initials(sessionStorage.getItem("name") || title)}
            src={sessionStorage.getItem("profilePictureUrl") || sessionStorage.getItem("profile_picture_url") || sessionStorage.getItem("avatarUrl") || ""}
            color={accent}
            size={42}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 900 }}>{title}</div>
            <div style={{ color: "#94a3b8", fontSize: 10 }}>{subtitle}</div>
          </div>
          <ProfileNavIcon />
        </button>

        <div style={{ margin: "4px 0", padding: "11px 12px", background: "rgba(30,41,59,0.62)", border: "1px solid rgba(148,163,184,0.18)", borderRadius: 16 }}>
          <div style={{ color: "#94a3b8", fontWeight: 700, fontSize: 9, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4 }}>For any queries</div>
          <a href="mailto:appraisal@dypiu.ac.in" style={{ color: "#c7d2fe", fontWeight: 700, fontSize: 11, wordBreak: "break-all", textDecoration: "none" }}>appraisal@dypiu.ac.in</a>
        </div>
        <div style={S.sideActions}>
          <button type="button" onClick={() => setShowLogoutModal(true)} style={S.sideButton}>
            <LogoutButtonIcon />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, minWidth: 0, marginLeft: 260, padding: "22px 26px", overflowX: "auto", position: "relative" }}>
        {tab === "self" ? (
          <NonTeachingAppraisalForm role={reviewerRole} embedded />
        ) : loadError ? (
          <div style={{ color: "#991b1b", background: "#fee2e2", border: "1px solid #fecaca", borderRadius: 10, padding: "16px 18px", fontSize: 13, marginTop: 28 }}>
            Unable to load the review queue. {loadError}
          </div>
        ) : !selected ? (
          <>
            {loading && (
              <div className="appraisal-year-loading-overlay" role="status" aria-live="polite">
                <div className="appraisal-year-loading-card">
                  <div className="appraisal-year-loading-spinner" />
                  <div className="appraisal-year-loading-textwrap">
                    <div className="appraisal-year-loading-text">Loading {selectedAcademicYear || "academic year"} data…</div>
                    <div className="appraisal-year-loading-subtext">Fetching review queue records</div>
                    <div className="appraisal-year-loading-dots"><span /><span /><span /></div>
                  </div>
                </div>
              </div>
            )}
            <div className="appraisal-page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 18, background: "#fff", borderRadius: 14, padding: "16px 24px", boxShadow: "0 10px 28px rgba(17,24,39,0.06)", border: "1px solid #e5e7eb", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <AppraisalHeaderImage logo="dypiu" />
                <div>
                  <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#0f172a", letterSpacing: -0.5 }}>Non Teaching Approval</h1>
                  <div style={{ marginTop: 5, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", color: "#64748b", fontSize: 11 }}>
                    <span>AY</span>
                    <select
                      value={selectedAcademicYear}
                      onChange={(event) => handleAcademicYearChange(event.target.value)}
                      style={{ height: 28, display: "inline-flex", alignItems: "center", border: "1px solid #cbd5e1", borderRadius: 7, background: "#fff", color: "#0f172a", fontSize: 11, fontWeight: 800, padding: "0 10px", fontFamily: "inherit", outline: "none", cursor: "pointer" }}
                    >
                      {academicYearOptions.map((cycle) => (
                        <option key={cycle.academic_year} value={cycle.academic_year}>
                          {cycle.academic_year} {cycle.is_open ? "(Active)" : "(Closed)"}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 20, background: "#fef3c7", color: "#92400e" }}>{pendingCount} Pending</div>
                <div style={{ fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 20, background: "#d1fae5", color: "#065f46" }}>{reviewedCount} Reviewed</div>
                <AppraisalHeaderImage logo="iqas" />
              </div>
            </div>

            {items.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>
                <div style={{ fontWeight: 700, color: "#0f172a" }}>All caught up!</div>
                <div style={{ color: "#64748b", fontSize: 12 }}>No appraisals in your queue right now.</div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
                {items.map((item) => (
                  <NonTeachingReviewCard key={item.id} item={item} reviewerRole={reviewerRole} onOpen={() => setSelectedId(item.id)} />
                ))}
              </div>
            )}
          </>
        ) : (
          <NonTeachingAuthorityReviewPanel
            item={selected}
            reviewerRole={reviewerRole}
            readOnly={false}
            onBack={() => setSelectedId("")}
            onSubmitted={(updated) => {
              setItems((current) => current.map((item) => item.id === updated.id ? updated : item));
              setSelectedId("");
              loadQueue();
            }}
          />
        )}
      </main>

      {showLogoutModal && <LogoutConfirmModal portalName={APP_INFO.PORTAL_NAME} onCancel={() => setShowLogoutModal(false)} onConfirm={() => { clearUserSession(); navigate("/login", { replace: true }); }} />}
    </div>
  );
}

function PersonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21a8 8 0 0 0-16 0" />
      <path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
    </svg>
  );
}

function ProfileNavIcon() {
  return (
    <span style={{ width: 28, height: 28, borderRadius: 10, background: "rgba(148,163,184,0.10)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M19 21a7 7 0 0 0-14 0" />
        <circle cx="12" cy="8" r="4" />
      </svg>
    </span>
  );
}

function SelfNavIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v5h5" />
      <path d="M9 13h6" />
      <path d="M9 17h4" />
    </svg>
  );
}

function ReviewNavIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 11 11 13 15 9" />
      <path d="M7 3h7l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
      <path d="M14 3v4h4" />
    </svg>
  );
}

function LogoutButtonIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M10 17 15 12 10 7" />
      <path d="M15 12H3" />
      <path d="M21 19V5a2 2 0 0 0-2-2h-6" />
    </svg>
  );
}

const S = {
  headerButton: {
    border: "1px solid #cbd5e1",
    borderRadius: 8,
    background: "#fff",
    color: "#0f172a",
    padding: "8px 12px",
    cursor: "pointer",
    fontWeight: 800,
    fontSize: 12,
    fontFamily: "inherit",
  },
  sideButton: {
    width: "100%",
    minHeight: 54,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    border: "1px solid rgba(248,113,113,0.55)",
    borderRadius: 14,
    background: "#111827",
    color: "#f87171",
    padding: "13px 16px",
    cursor: "pointer",
    fontWeight: 900,
    fontSize: 13,
    fontFamily: "inherit",
  },
  sideActions: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 18,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    paddingTop: 10,
    borderTop: "1px solid #1e293b",
    background: "#0f172a",
  },
};

export default function NonTeachingStaffDashboard() {
  return <NonTeachingAppraisalForm role="non_teaching_staff" />;
}
