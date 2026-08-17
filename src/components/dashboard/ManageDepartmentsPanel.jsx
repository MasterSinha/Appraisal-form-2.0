import { useState, useEffect, useCallback } from "react";
import { listSchoolDepartments, addSchoolDepartment, removeSchoolDepartment } from "../../services/departmentsService";
import { fetchSchoolHods, transferRole, removeRoleAssignment, deactivateHodAccount } from "../../services/roleAssignmentsService";
import { fetchSchoolFaculty, assignFacultyToProgram } from "../../services/facultyAssignmentService";
import { isSoemrSchool, SOEMR_DEPARTMENTS } from "../../constants/universityHierarchy";
import CreateHodForm from "./CreateHodForm";

const initialsFor = (value = "") => {
  const trimmed = String(value).trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
  return trimmed.slice(0, 2).toUpperCase();
};

const hodPrograms = (hod = {}) => (Array.isArray(hod.departments) ? hod.departments.filter(Boolean) : []);

const selectStyle = { padding: "8px 10px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 12.5, fontFamily: "inherit", outline: "none", background: "#fff", color: "#0f172a" };

// - Modal shell (reused for "Create HOD") -
function Modal({ title, subtitle, onClose, children, width = 520, icon, accent = "#4338ca" }) {
  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(15,23,42,0.5)", backdropFilter: "blur(3px)", WebkitBackdropFilter: "blur(3px)", display: "grid", placeItems: "center", padding: 24, boxSizing: "border-box", overflow: "hidden", animation: "mdp-fade 0.16s ease" }}
      onClick={onClose}
    >
      <div
        style={{ width: `min(${width}px, 94vw)`, maxWidth: "100%", boxSizing: "border-box", maxHeight: "90vh", overflowY: "auto", overflowX: "hidden", background: "#fff", borderRadius: 20, border: "1px solid #eef2f7", boxShadow: "0 30px 80px rgba(15,23,42,0.30)", padding: 32, animation: "mdp-pop 0.18s cubic-bezier(0.2,0.9,0.3,1.1)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14, marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14, minWidth: 0 }}>
            {icon && (
              <span style={{ width: 46, height: 46, borderRadius: 13, background: `${accent}14`, color: accent, border: `1px solid ${accent}2A`, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {icon}
              </span>
            )}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 19, fontWeight: 900, color: "#0f172a", letterSpacing: -0.3 }}>{title}</div>
              {subtitle && <div style={{ fontSize: 12.5, color: "#64748b", marginTop: 5, lineHeight: 1.55 }}>{subtitle}</div>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="mdp-modal-close"
            style={{ width: 32, height: 32, flexShrink: 0, borderRadius: 10, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#64748b", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", transition: "background .15s, color .15s" }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>
        {children}
      </div>
      <style>{`
        @keyframes mdp-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes mdp-pop { from { opacity: 0; transform: scale(0.96) translateY(6px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .mdp-modal-close:hover { background: #fee2e2 !important; color: #dc2626 !important; }
      `}</style>
    </div>
  );
}

// - Step indicator bar shared by all 3 steps -
function StepBar({ step, onStepChange, unitLabel }) {
  const steps = [
    { id: 1, label: `Create ${unitLabel}` },
    { id: 2, label: "Create HOD" },
    { id: 3, label: "Assign Faculty" },
  ];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", borderRadius: 16, padding: "16px 20px", boxShadow: "0 12px 32px rgba(15,23,42,0.06)", border: "1px solid #e5e7eb", flexWrap: "wrap" }}>
      {steps.map((s, idx) => (
        <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            type="button"
            onClick={() => onStepChange(s.id)}
            style={{ display: "flex", alignItems: "center", gap: 10, border: "none", background: step === s.id ? "#eef2ff" : "transparent", cursor: "pointer", fontFamily: "inherit", padding: "8px 12px", borderRadius: 11, transition: "background .15s" }}
          >
            <span style={{ width: 28, height: 28, borderRadius: 999, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12.5, fontWeight: 900, flexShrink: 0, background: step === s.id ? "#4338ca" : step > s.id ? "#dcfce7" : "#f1f5f9", color: step === s.id ? "#fff" : step > s.id ? "#16a34a" : "#94a3b8", transition: "background .15s, color .15s" }}>
              {step > s.id ? "✓" : s.id}
            </span>
            <span style={{ fontSize: 13, fontWeight: 800, color: step === s.id ? "#0f172a" : "#64748b" }}>{s.label}</span>
          </button>
          {idx < steps.length - 1 && <span style={{ width: 28, height: 2, background: step > s.id ? "#bbf7d0" : "#e2e8f0", borderRadius: 2 }} />}
        </div>
      ))}
    </div>
  );
}

// ============================== STEP 1: Create Program ==============================
function StepPrograms({ school, unitLabel, unitLabelLower, isDepartmentSchool, departments, loading, error, onRefresh, onNext }) {
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState("");

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    setLocalError("");
    try {
      await addSchoolDepartment(school, newName.trim());
      setNewName("");
      await onRefresh();
    } catch (err) {
      setLocalError(err?.message || `Could not add ${unitLabelLower}.`);
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (department) => {
    if (!window.confirm(`Remove "${department.name}"? Faculty/HOD already assigned to it will be affected.`)) return;
    setLocalError("");
    try {
      await removeSchoolDepartment(school, department.id);
      await onRefresh();
    } catch (err) {
      setLocalError(err?.message || `Could not remove ${unitLabelLower}.`);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 12px 30px rgba(15,23,42,0.05)", border: "1px solid #e2e8f0", padding: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 900, color: "#0f172a", marginBottom: 2 }}>Step 1 · Create {unitLabel}</div>
        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>
          {isDepartmentSchool ? "Add every department this school is organized into." : "Add every program this school offers - one HOD can later be assigned to several of them."}
        </div>
        <form onSubmit={handleAdd} style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={isDepartmentSchool ? "e.g. Computer Science" : "e.g. B.Tech Computer Science"}
            maxLength={100}
            style={{ flex: "1 1 260px", padding: "11px 13px", border: "1.5px solid #dbe3ef", borderRadius: 10, fontSize: 13.5, fontFamily: "inherit", outline: "none" }}
          />
          <button
            type="submit"
            disabled={saving || !newName.trim()}
            style={{ padding: "10px 20px", background: "#0f766e", color: "#fff", border: "none", borderRadius: 10, fontWeight: 800, fontSize: 13, cursor: saving || !newName.trim() ? "not-allowed" : "pointer", opacity: saving || !newName.trim() ? 0.6 : 1, fontFamily: "inherit" }}
          >
            {saving ? "Adding..." : `+ Add ${unitLabel}`}
          </button>
        </form>
        {(localError || error) && (
          <div style={{ marginTop: 12, background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", padding: "10px 14px", borderRadius: 10, fontSize: 12.5, fontWeight: 700 }}>{localError || error}</div>
        )}
      </div>

      <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 12px 30px rgba(15,23,42,0.05)", border: "1px solid #e2e8f0" }}>
        {loading ? (
          <div style={{ padding: "26px 16px", fontSize: 13, color: "#64748b", fontWeight: 700, textAlign: "center" }}>Loading {unitLabelLower}s...</div>
        ) : departments.length === 0 ? (
          <div style={{ padding: "30px 16px", fontSize: 13, color: "#94a3b8", fontWeight: 700, textAlign: "center" }}>No {unitLabelLower}s added yet - use the form above.</div>
        ) : (
          departments.map((dept, idx) => (
            <div key={dept.id || dept.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, padding: "13px 16px", borderBottom: idx < departments.length - 1 ? "1px solid #f1f5f9" : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <span style={{ width: 30, height: 30, borderRadius: 9, background: "#ecfeff", color: "#0891b2", border: "1px solid #cffafe", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, flexShrink: 0 }}>{dept.name.slice(0, 1).toUpperCase()}</span>
                <span style={{ fontSize: 13.5, fontWeight: 800, color: "#0f172a", overflowWrap: "anywhere" }}>{dept.name}</span>
              </div>
              <button type="button" onClick={() => handleRemove(dept)} style={{ border: "1px solid #fecaca", background: "#fff5f5", color: "#dc2626", borderRadius: 8, padding: "7px 10px", fontWeight: 800, fontSize: 11.5, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>
                Remove
              </button>
            </div>
          ))
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button type="button" onClick={onNext} disabled={departments.length === 0} style={{ padding: "11px 22px", background: departments.length === 0 ? "#cbd5e1" : "#4338ca", color: "#fff", border: "none", borderRadius: 10, fontWeight: 800, fontSize: 13, cursor: departments.length === 0 ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
          Next: Create HOD →
        </button>
      </div>
    </div>
  );
}

// ============================== STEP 2: Create HOD ==============================
function HodCard({ hod, availableDeptsForHod, onAssignProgram, onRemoveProgram, onRemoveHod, onBusyChange }) {
  const [pickedDept, setPickedDept] = useState("");
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState("");
  const programs = hodPrograms(hod);

  const handleAssign = async () => {
    if (!pickedDept) return;
    setBusy(true);
    onBusyChange?.(true);
    setError("");
    try {
      await onAssignProgram(hod, pickedDept);
      setPickedDept("");
    } catch (err) {
      setError(err?.message || "Could not assign program.");
    } finally {
      setBusy(false);
      onBusyChange?.(false);
    }
  };

  const handleRemove = async (deptName) => {
    setBusy(true);
    setError("");
    try {
      await onRemoveProgram(hod, deptName);
    } catch (err) {
      setError(err?.message || "Could not remove program.");
    } finally {
      setBusy(false);
    }
  };

  const handleRemoveHod = async () => {
    if (!window.confirm(`Remove ${hod.fullName || hod.email}'s HOD account entirely? This clears all their program assignments and deactivates the account.`)) return;
    setRemoving(true);
    setError("");
    try {
      await onRemoveHod(hod);
    } catch (err) {
      setError(err?.message || "Could not remove HOD account.");
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="mdp-hod-card" style={{ display: "flex", flexDirection: "column", gap: 12, border: "1px solid #eef1f6", borderRadius: 16, background: "#fff", padding: 16, minWidth: 0, boxShadow: "0 4px 14px rgba(15,23,42,0.04)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ borderRadius: 999, padding: 2, background: programs.length ? "linear-gradient(135deg,#a5b4fc,#4338ca)" : "linear-gradient(135deg,#e2e8f0,#94a3b8)", flexShrink: 0, display: "inline-flex" }}>
          <span style={{ width: 42, height: 42, borderRadius: 999, background: programs.length ? "#4338ca" : "#94a3b8", color: "#fff", fontSize: 13, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #fff" }}>{initialsFor(hod.fullName || hod.email)}</span>
        </span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 13.5, fontWeight: 800, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{hod.fullName || hod.email}</div>
          <div style={{ fontSize: 11, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 1 }}>{hod.email}</div>
        </div>
        <button
          type="button"
          onClick={handleRemoveHod}
          disabled={removing}
          title="Remove this HOD account"
          style={{ width: 28, height: 28, flexShrink: 0, border: "1px solid #fecaca", background: "#fff5f5", color: "#dc2626", borderRadius: 8, cursor: removing ? "wait" : "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /></svg>
        </button>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
        {programs.length === 0 ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10.5, fontWeight: 800, color: "#991b1b", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 999, padding: "3px 9px" }}>
            <span style={{ width: 5, height: 5, borderRadius: 999, background: "#dc2626", flexShrink: 0 }} />
            Unassigned
          </span>
        ) : (
          programs.map((p) => (
            <span key={p} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 10.5, fontWeight: 800, color: "#065f46", background: "#ecfdf5", border: "1px solid #bbf7d0", borderRadius: 999, padding: "3px 6px 3px 10px" }}>
              {p}
              <button type="button" onClick={() => handleRemove(p)} disabled={busy} title="Remove this program" style={{ border: "none", background: "rgba(6,95,70,0.12)", color: "#065f46", cursor: busy ? "wait" : "pointer", fontWeight: 900, fontSize: 10, width: 15, height: 15, borderRadius: 999, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: 0, fontFamily: "inherit", lineHeight: 1, flexShrink: 0 }}>×</button>
            </span>
          ))
        )}
      </div>

      {availableDeptsForHod.length > 0 && (
        <div style={{ display: "flex", gap: 6, borderTop: "1px solid #f1f5f9", paddingTop: 12 }}>
          <select value={pickedDept} onChange={(e) => setPickedDept(e.target.value)} style={{ ...selectStyle, flex: 1, minWidth: 0, background: "#f8fafc", border: "1.5px solid #e2e8f0", height: 34 }}>
            <option value="">+ Assign a program...</option>
            {availableDeptsForHod.map((d) => (
              <option key={d.id} value={d.name}>{d.name}</option>
            ))}
          </select>
          <button type="button" onClick={handleAssign} disabled={!pickedDept || busy} style={{ border: "none", background: !pickedDept || busy ? "#e2e8f0" : "#4338ca", color: !pickedDept || busy ? "#94a3b8" : "#fff", borderRadius: 8, padding: "0 14px", fontWeight: 800, fontSize: 11.5, cursor: !pickedDept || busy ? "not-allowed" : "pointer", fontFamily: "inherit", boxShadow: !pickedDept || busy ? "none" : "0 6px 14px rgba(67,56,202,0.25)", transition: "filter .15s" }}>
            {busy ? "..." : "Add"}
          </button>
        </div>
      )}
      {error && <div style={{ fontSize: 11, color: "#991b1b", fontWeight: 700 }}>{error}</div>}
    </div>
  );
}

function StepHods({ school, departments, existingHods, loading, unitLabelLower, onRefresh, onBack, onNext }) {
  const [createHodOpen, setCreateHodOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const assigned = existingHods.filter((h) => hodPrograms(h).length > 0);
  const unassigned = existingHods.filter((h) => hodPrograms(h).length === 0);
  const shown = filter === "assigned" ? assigned : filter === "unassigned" ? unassigned : existingHods;

  const handleAssignProgram = async (hod, deptName) => {
    const dept = departments.find((d) => d.name === deptName);
    if (!dept) throw new Error("Program not found.");
    await transferRole({ roleType: "HOD", scopeId: dept.id, incomingEmail: hod.email });
    await onRefresh();
  };

  const handleRemoveProgram = async (hod, deptName) => {
    const dept = departments.find((d) => d.name === deptName);
    if (!dept) throw new Error("Program not found.");
    if (!window.confirm(`Remove ${hod.fullName || hod.email} from ${deptName}?`)) return;
    await removeRoleAssignment({ roleType: "HOD", scopeId: dept.id });
    await onRefresh();
  };

  // Clears every program this HOD currently holds, then deactivates the account itself -
  // confirmation already happened in HodCard before this runs.
  const handleRemoveHod = async (hod) => {
    const programs = hodPrograms(hod);
    for (const programName of programs) {
      const dept = departments.find((d) => d.name === programName);
      if (dept) await removeRoleAssignment({ roleType: "HOD", scopeId: dept.id });
    }
    await deactivateHodAccount({ schoolCode: school, email: hod.email });
    await onRefresh();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ position: "relative", overflow: "hidden", background: "linear-gradient(135deg, #4338ca 0%, #0f172a 130%)", borderRadius: 16, padding: "20px 24px", boxShadow: "0 16px 36px rgba(67,56,202,0.18)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div style={{ position: "absolute", top: -50, right: -30, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.06)", pointerEvents: "none" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 14, position: "relative", zIndex: 1 }}>
          <span style={{ width: 42, height: 42, borderRadius: 13, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#fff" }}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21a8 8 0 0 0-16 0" /><circle cx="12" cy="11" r="4" /><path d="M22 21v-1a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
          </span>
          <div>
            <div style={{ fontSize: 14.5, fontWeight: 900, color: "#fff" }}>Step 2 · Create HOD</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.68)", marginTop: 2 }}>Create HOD accounts, then assign each one to one or more {unitLabelLower}s.</div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setCreateHodOpen(true)}
          style={{ position: "relative", zIndex: 1, border: "none", background: "#fff", color: "#4338ca", borderRadius: 10, padding: "11px 18px", fontWeight: 800, fontSize: 12.5, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 10px 22px rgba(0,0,0,0.18)" }}
        >
          + Create HOD
        </button>
      </div>

      <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 12px 30px rgba(15,23,42,0.05)", border: "1px solid #e2e8f0", padding: 18 }}>
        <div style={{ display: "flex", gap: 6, background: "#f1f3f9", borderRadius: 10, padding: 3, width: "fit-content", marginBottom: 16 }}>
          {[
            ["all", `All (${existingHods.length})`],
            ["assigned", `Assigned (${assigned.length})`],
            ["unassigned", `Unassigned (${unassigned.length})`],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              style={{ border: "none", borderRadius: 8, padding: "7px 13px", fontSize: 11.5, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", background: filter === value ? "#fff" : "transparent", color: filter === value ? "#0f172a" : "#64748b", boxShadow: filter === value ? "0 2px 8px rgba(15,23,42,0.10)" : "none", whiteSpace: "nowrap", transition: "background .15s, box-shadow .15s" }}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ fontSize: 12.5, color: "#64748b", fontWeight: 700, textAlign: "center", padding: "14px 0" }}>Loading HODs...</div>
        ) : existingHods.length === 0 ? (
          <div style={{ textAlign: "center", padding: "18px 0" }}>
            <div style={{ fontSize: 12.5, color: "#94a3b8", fontWeight: 700, marginBottom: 10 }}>No HOD accounts created for this school yet.</div>
            <button type="button" onClick={() => setCreateHodOpen(true)} style={{ border: "1px solid #c7d2fe", background: "#eef2ff", color: "#4338ca", borderRadius: 9, padding: "8px 14px", fontWeight: 800, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
              + Create your first HOD
            </button>
          </div>
        ) : shown.length === 0 ? (
          <div style={{ fontSize: 12.5, color: "#94a3b8", fontWeight: 700, textAlign: "center", padding: "14px 0" }}>No HODs in this filter.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
            {shown.map((hod) => (
              <HodCard
                key={hod.email}
                hod={hod}
                availableDeptsForHod={departments.filter((d) => !hodPrograms(hod).includes(d.name))}
                onAssignProgram={handleAssignProgram}
                onRemoveProgram={handleRemoveProgram}
                onRemoveHod={handleRemoveHod}
              />
            ))}
          </div>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <button type="button" onClick={onBack} style={{ padding: "11px 22px", background: "#fff", color: "#475569", border: "1px solid #e2e8f0", borderRadius: 10, fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
          ← Back
        </button>
        <button type="button" onClick={onNext} disabled={existingHods.length === 0} style={{ padding: "11px 22px", background: existingHods.length === 0 ? "#cbd5e1" : "#4338ca", color: "#fff", border: "none", borderRadius: 10, fontWeight: 800, fontSize: 13, cursor: existingHods.length === 0 ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
          Next: Assign Faculty →
        </button>
      </div>

      {createHodOpen && (
        <Modal
          title="Create HOD Account"
          subtitle={`Pick any number of ${unitLabelLower}s to assign right away, or skip and assign later from the HOD's card.`}
          onClose={() => setCreateHodOpen(false)}
          accent="#4338ca"
          width={620}
          icon={<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3.2 19 6v5.2c0 4.4-2.9 7.6-7 8.6-4.1-1-7-4.2-7-8.6V6l7-2.8Z" /><path d="m9.3 12 1.8 1.8 3.6-3.8" /></svg>}
        >
          <CreateHodForm
            school={school}
            departments={departments}
            accent="#4338ca"
            onCreated={async () => {
              setCreateHodOpen(false);
              await onRefresh();
            }}
          />
        </Modal>
      )}
    </div>
  );
}

// ============================== STEP 3: Assign Faculty ==============================
function StepFaculty({ school, existingHods, unitLabelLower, onBack }) {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refreshFaculty = useCallback(async () => {
    if (!school) return;
    setLoading(true);
    setError("");
    try {
      setFaculty(await fetchSchoolFaculty(school));
    } catch (err) {
      setError(err?.message || "Could not load faculty.");
    } finally {
      setLoading(false);
    }
  }, [school]);

  useEffect(() => {
    const t = setTimeout(refreshFaculty, 0);
    return () => clearTimeout(t);
  }, [refreshFaculty]);

  // Flatten every HOD's programs into individually pickable "HOD - Program" options, since one
  // HOD covering several programs still needs a single unambiguous choice per faculty member.
  const hodProgramOptions = existingHods.flatMap((hod) =>
    hodPrograms(hod).map((programName) => ({
      key: `${hod.email}::${programName}`,
      hodEmail: hod.email,
      hodName: hod.fullName || hod.email,
      programName,
    }))
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 12px 30px rgba(15,23,42,0.05)", border: "1px solid #e2e8f0", padding: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 900, color: "#0f172a" }}>Step 3 · Assign Faculty</div>
        <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Pick which HOD each faculty member reports to. This sets their {unitLabelLower} to match that HOD's.</div>
      </div>

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", padding: "10px 14px", borderRadius: 10, fontSize: 12.5, fontWeight: 700 }}>{error}</div>
      )}

      {hodProgramOptions.length === 0 && (
        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", color: "#92400e", padding: "10px 14px", borderRadius: 10, fontSize: 12.5, fontWeight: 700 }}>
          No HOD is assigned to a {unitLabelLower} yet - go back to Step 2 and assign at least one before you can assign faculty here.
        </div>
      )}

      <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 12px 30px rgba(15,23,42,0.05)", border: "1px solid #e2e8f0" }}>
        {loading ? (
          <div style={{ padding: "26px 16px", fontSize: 13, color: "#64748b", fontWeight: 700, textAlign: "center" }}>Loading faculty...</div>
        ) : faculty.length === 0 ? (
          <div style={{ padding: "30px 16px", fontSize: 13, color: "#94a3b8", fontWeight: 700, textAlign: "center" }}>No faculty accounts found for this school yet.</div>
        ) : (
          faculty.map((person, idx) => (
            <FacultyRow key={person.email} person={person} isLast={idx === faculty.length - 1} options={hodProgramOptions} school={school} onAssigned={refreshFaculty} />
          ))
        )}
      </div>

      <div>
        <button type="button" onClick={onBack} style={{ padding: "11px 22px", background: "#fff", color: "#475569", border: "1px solid #e2e8f0", borderRadius: 10, fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
          ← Back
        </button>
      </div>
    </div>
  );
}

function FacultyRow({ person, isLast, options, school, onAssigned }) {
  const currentOption = options.find((o) => o.programName === person.department);
  const [picked, setPicked] = useState(currentOption?.key || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleAssign = async () => {
    const option = options.find((o) => o.key === picked);
    if (!option) return;
    setBusy(true);
    setError("");
    try {
      await assignFacultyToProgram({ schoolCode: school, facultyEmail: person.email, departmentName: option.programName });
      await onAssigned?.();
    } catch (err) {
      setError(err?.message || "Could not assign faculty.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, padding: "12px 16px", borderBottom: isLast ? "none" : "1px solid #f1f5f9", flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: "1 1 220px" }}>
        <span style={{ width: 30, height: 30, borderRadius: 999, background: "#e2e8f0", color: "#475569", fontSize: 11, fontWeight: 900, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{initialsFor(person.fullName || person.email)}</span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{person.fullName || person.email}</div>
          <div style={{ fontSize: 11, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{person.email}{person.department ? ` · ${person.department}` : ""}</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <select value={picked} onChange={(e) => setPicked(e.target.value)} disabled={options.length === 0} style={{ ...selectStyle, minWidth: 220 }}>
          <option value="">Select HOD...</option>
          {options.map((o) => (
            <option key={o.key} value={o.key}>{o.hodName} — {o.programName}</option>
          ))}
        </select>
        <button type="button" onClick={handleAssign} disabled={!picked || busy} style={{ border: "1px solid #c7d2fe", background: "#eef2ff", color: "#4338ca", borderRadius: 8, padding: "8px 14px", fontWeight: 800, fontSize: 11.5, cursor: !picked || busy ? "not-allowed" : "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
          {busy ? "Assigning..." : "Assign"}
        </button>
      </div>
      {error && <div style={{ width: "100%", fontSize: 11.5, color: "#991b1b" }}>{error}</div>}
    </div>
  );
}

// Director-only panel for managing the department/program list of their own school, which HOD
// (if any) owns each one, and which faculty individually report to which HOD. SoEMR is
// organized into departments (one HOD per department); every other school is organized into
// programs, where one HOD can be assigned to several programs at once - see
// backend_changes_requied.md / New_backend.md. Built as a 3-step wizard: Create Program ->
// Create HOD -> Assign Faculty, since each step depends on the previous one's data existing.
export default function ManageDepartmentsPanel({ school }) {
  const isDepartmentSchool = isSoemrSchool(school);
  const unitLabel = isDepartmentSchool ? "Department" : "Program";
  const unitLabelLower = unitLabel.toLowerCase();

  const [step, setStep] = useState(1);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [existingHods, setExistingHods] = useState([]);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!school) return;
    setLoading(true);
    try {
      let [departmentList, hodList] = await Promise.all([listSchoolDepartments(school), fetchSchoolHods(school)]);
      // SoEMR previously ran on 4 hardcoded departments (SOEMR_DEPARTMENTS) before departments
      // became Director-managed. Seed them once so existing SoEMR HOD/faculty routing keeps
      // working the first time this panel loads against a school with zero departments on record.
      if (isDepartmentSchool && departmentList.length === 0) {
        await Promise.all(SOEMR_DEPARTMENTS.map((name) => addSchoolDepartment(school, name).catch(() => null)));
        departmentList = await listSchoolDepartments(school);
      }
      setDepartments(departmentList);
      setExistingHods(hodList);
    } catch (err) {
      setError(err?.message || `Could not load ${unitLabelLower}s.`);
    } finally {
      setLoading(false);
    }
  }, [school, unitLabelLower, isDepartmentSchool]);

  useEffect(() => {
    const timer = setTimeout(refresh, 0);
    return () => clearTimeout(timer);
  }, [refresh]);

  const assignedHodCount = existingHods.filter((h) => hodPrograms(h).length > 0).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%", boxSizing: "border-box" }}>
      <style>{`
        .mdp-hod-card { transition: transform .16s ease, box-shadow .16s ease, border-color .16s ease; }
        .mdp-hod-card:hover { transform: translateY(-3px); box-shadow: 0 16px 32px rgba(15,23,42,0.08); border-color: #dbeafe; }
      `}</style>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg,#ede9fe,#ddd6fe)", color: "#6d28d9", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="M5 10.5V16c0 1.5 3.13 3 7 3s7-1.5 7-3v-5.5" /><path d="M21 9v6.5" /></svg>
          </span>
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#0f172a" }}>{unitLabel}s & HODs</div>
            <div style={{ fontSize: 12.5, color: "#64748b", marginTop: 3 }}>
              {departments.length} {unitLabelLower}{departments.length === 1 ? "" : "s"} · {existingHods.length} HOD{existingHods.length === 1 ? "" : "s"} · {assignedHodCount} assigned
            </div>
          </div>
        </div>
      </div>

      <StepBar step={step} onStepChange={setStep} unitLabel={unitLabel} />

      {step === 1 && (
        <StepPrograms
          school={school}
          unitLabel={unitLabel}
          unitLabelLower={unitLabelLower}
          isDepartmentSchool={isDepartmentSchool}
          departments={departments}
          loading={loading}
          error={error}
          onRefresh={refresh}
          onNext={() => setStep(2)}
        />
      )}

      {step === 2 && (
        <StepHods
          school={school}
          departments={departments}
          existingHods={existingHods}
          loading={loading}
          unitLabelLower={unitLabelLower}
          onRefresh={refresh}
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
        />
      )}

      {step === 3 && (
        <StepFaculty
          school={school}
          existingHods={existingHods}
          unitLabelLower={unitLabelLower}
          onBack={() => setStep(2)}
        />
      )}
    </div>
  );
}
