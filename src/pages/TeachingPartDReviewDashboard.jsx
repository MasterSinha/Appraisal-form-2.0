import { useEffect, useState } from "react";
import { APP_INFO } from "../constants/formConfig";
import { Avatar } from "../components/dashboard/dashboardPrimitives";
import RegistrarLeaveManagement from "../components/appraisal/PartD/RegistrarLeaveManagement";
import { fetchPartDRegistrarQueue, submitPartDRegistrarReview } from "../services/reviewWorkflow";
import { getActiveAcademicYear } from "../auth/session";
import { roleLabel } from "../utils/hierarchy";

// Registrar-only queue for Part D (Leave & Attendance) of teaching-staff forms (Faculty/HOD/
// Director/Dean/Center Head, any school) - a track independent of the A/B/C/E chain that never
// routes through HOD/Director/Dean. See PART_D_STATUSES in utils/hierarchy.js.
//
// Pure content, no sidebar/layout of its own - the caller (NonTeachingReviewDashboard) renders
// this inline as one of its own tabs so switching to/from it stays on the same page instead of
// swapping to a differently-chromed dashboard.
export default function TeachingPartDReviewDashboard({ accent = "#155e75" }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [score, setScore] = useState("");
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const academicYear = getActiveAcademicYear() || APP_INFO.DEFAULT_AY;

  const loadQueue = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const queue = await fetchPartDRegistrarQueue({ academicYear });
      setItems(queue);
    } catch (err) {
      console.error("Could not load Part D review queue:", err);
      setLoadError(err.message || "Could not load the Part D review queue.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(loadQueue, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [academicYear]);

  const selected = items.find((item) => item.id === selectedId);

  useEffect(() => {
    const timer = setTimeout(() => {
      setScore("");
      setRemarks("");
      setSaveError("");
    }, 0);
    return () => clearTimeout(timer);
  }, [selectedId]);

  const handleSubmit = async () => {
    if (!selected) return;
    if (score === "" || Number.isNaN(Number(score))) {
      setSaveError("Please enter a valid score.");
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      await submitPartDRegistrarReview({
        subjectEmail: selected.email,
        academicYear,
        score,
        remarks,
        subjectProfile: selected,
      });
      setSelectedId("");
      await loadQueue();
    } catch (err) {
      setSaveError(err.message || "Could not submit the Part D review.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div style={{ position: "relative", overflow: "hidden", background: `linear-gradient(135deg, ${accent} 0%, #0f172a 130%)`, borderRadius: 18, padding: "20px 26px", boxShadow: "0 18px 40px rgba(15,23,42,0.16)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ position: "absolute", top: -60, right: -40, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.06)", pointerEvents: "none" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 16, position: "relative", zIndex: 1 }}>
          <span style={{ width: 46, height: 46, borderRadius: 14, background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.16)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#fff" }}>
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M9 8h6" /><path d="M9 12h6" /><path d="M9 16h3" /></svg>
          </span>
          <div>
            <h1 style={{ margin: 0, fontSize: 21, fontWeight: 900, color: "#fff", letterSpacing: -0.4 }}>
              Part D - Teaching Staff Leave &amp; Attendance
            </h1>
            <p style={{ margin: "6px 0 0", fontSize: 12.5, color: "rgba(255,255,255,0.72)", maxWidth: 640, lineHeight: 1.5 }}>
              Score Part D for Faculty, HOD, Director, Dean and Center Head appraisal forms. This never
              routes through HOD/Director/Dean - only the Registrar scores it.
            </p>
          </div>
        </div>
      </div>

      {loadError && (
        <div style={{ marginTop: 16, background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", padding: "10px 14px", borderRadius: 8, fontSize: 12 }}>
          {loadError}
        </div>
      )}

      <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "320px 1fr", gap: 18, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 12, maxHeight: "70vh", overflowY: "auto" }}>
          {loading ? (
            <div style={{ fontSize: 13, color: "#64748b", padding: 12 }}>Loading...</div>
          ) : items.length === 0 ? (
            <div style={{ fontSize: 13, color: "#64748b", padding: 12 }}>No Part D reviews pending.</div>
          ) : (
            items.map((item) => {
              const isActive = item.id === selectedId;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, border: isActive ? "1.5px solid #155e75" : "1px solid #e2e8f0", background: isActive ? "#ecfeff" : "#fff", cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}
                >
                  <Avatar initials={item.avatar} src={item.avatarUrl} color="#155e75" size={34} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {roleLabel(item.appraisalRole)} - {item.school || "-"}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 18 }}>
          {!selected ? (
            <div style={{ fontSize: 13, color: "#64748b" }}>Select a person from the list to review their Part D.</div>
          ) : (
            <>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{selected.name}</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>
                  {roleLabel(selected.appraisalRole)} - {selected.school || "-"} {selected.department ? `- ${selected.department}` : ""}
                </div>
              </div>

              <RegistrarLeaveManagement
                ctx={{ leaveManagement: selected.leaveManagement }}
                score={score}
                remarks={remarks}
                onScoreChange={setScore}
                onRemarksChange={setRemarks}
                disabled={saving}
              />

              {saveError && (
                <div style={{ marginTop: 12, background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", padding: "10px 14px", borderRadius: 8, fontSize: 12 }}>
                  {saveError}
                </div>
              )}

              <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={saving}
                  style={{ padding: "10px 22px", background: "#155e75", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1, fontFamily: "inherit" }}
                >
                  {saving ? "Submitting..." : "Submit Part D Review"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
