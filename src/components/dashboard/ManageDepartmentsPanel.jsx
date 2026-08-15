import { useState, useEffect, useCallback, useMemo } from "react";
import { listSchoolDepartments, addSchoolDepartment, removeSchoolDepartment } from "../../services/departmentsService";
import { fetchSchoolHods, transferRole, removeRoleAssignment, fetchActiveRoleAssignments } from "../../services/roleAssignmentsService";
import { isSoemrSchool } from "../../constants/universityHierarchy";
import CreateHodForm from "./CreateHodForm";

const initialsFor = (value = "") => {
  const trimmed = String(value).trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
  return trimmed.slice(0, 2).toUpperCase();
};

const hodPrograms = (hod = {}) => (Array.isArray(hod.departments) ? hod.departments.filter(Boolean) : []);

// - Modal shell (reused for "Add Program" and "Create HOD") -
function Modal({ title, subtitle, onClose, children, width = 440 }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(15,23,42,0.55)", display: "grid", placeItems: "center", padding: 20 }} onClick={onClose}>
      <div style={{ width: `min(${width}px, 94vw)`, maxHeight: "88vh", overflowY: "auto", background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", boxShadow: "0 24px 70px rgba(15,23,42,0.28)", padding: 22 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14, marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 900, color: "#0f172a" }}>{title}</div>
            {subtitle && <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{subtitle}</div>}
          </div>
          <button type="button" onClick={onClose} style={{ width: 30, height: 30, flexShrink: 0, borderRadius: 9, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#475569", cursor: "pointer", fontWeight: 900, fontFamily: "inherit" }}>X</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// - Inline "assign HOD" popover for one program row -
function AssignPopover({ availableHods, onPick, onCreateNew, onClose }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return availableHods;
    return availableHods.filter((h) => (h.fullName || "").toLowerCase().includes(q) || (h.email || "").toLowerCase().includes(q));
  }, [availableHods, query]);

  return (
    <div
      style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 30, width: 300, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, boxShadow: "0 18px 44px rgba(15,23,42,0.16)", padding: 10 }}
      onClick={(e) => e.stopPropagation()}
    >
      <input
        autoFocus
        type="text"
        placeholder="Search HODs by name or email..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 12.5, fontFamily: "inherit", outline: "none", marginBottom: 8 }}
      />
      <div style={{ maxHeight: 220, overflowY: "auto", display: "flex", flexDirection: "column", gap: 3 }}>
        {filtered.length === 0 ? (
          <div style={{ fontSize: 12, color: "#94a3b8", padding: "10px 6px", textAlign: "center" }}>
            {availableHods.length === 0 ? "No HOD accounts yet." : "No match."}
          </div>
        ) : (
          filtered.map((hod) => (
            <button
              key={hod.email}
              type="button"
              onClick={() => onPick(hod.email)}
              style={{ display: "flex", alignItems: "center", gap: 8, textAlign: "left", border: "none", background: "transparent", borderRadius: 8, padding: "7px 8px", cursor: "pointer", fontFamily: "inherit" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#f8fafc"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <span style={{ width: 26, height: 26, borderRadius: 999, background: "#4338ca", color: "#fff", fontSize: 10, fontWeight: 900, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{initialsFor(hod.fullName || hod.email)}</span>
              <span style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{hod.fullName || hod.email}</div>
                {hodPrograms(hod).length > 0 && (
                  <div style={{ fontSize: 10.5, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>also: {hodPrograms(hod).join(", ")}</div>
                )}
              </span>
            </button>
          ))
        )}
      </div>
      <div style={{ borderTop: "1px solid #eef2f7", marginTop: 8, paddingTop: 8, display: "flex", gap: 8 }}>
        <button type="button" onClick={onCreateNew} style={{ flex: 1, border: "1px dashed #c7d2fe", background: "#eef2ff", color: "#4338ca", borderRadius: 8, padding: "7px 8px", fontSize: 11.5, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
          + Create new HOD
        </button>
        <button type="button" onClick={onClose} style={{ border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", borderRadius: 8, padding: "7px 10px", fontSize: 11.5, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

// - One program row: name, assigned-HOD cell, actions -
function ProgramRow({ dept, unitLabelLower, availableHods, onRemoveProgram, onDirectoryRefresh, onCreateNewFor }) {
  const [holders, setHolders] = useState([]);
  const [loadingHolders, setLoadingHolders] = useState(true);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const refreshHolders = useCallback(async () => {
    setLoadingHolders(true);
    try {
      setHolders(await fetchActiveRoleAssignments({ roleType: "HOD", scopeId: dept.id }));
    } finally {
      setLoadingHolders(false);
    }
  }, [dept.id]);

  useEffect(() => {
    const t = setTimeout(refreshHolders, 0);
    return () => clearTimeout(t);
  }, [refreshHolders]);

  const handlePick = async (email) => {
    setBusy(true);
    setError("");
    try {
      await transferRole({ roleType: "HOD", scopeId: dept.id, incomingEmail: email });
      setPopoverOpen(false);
      await refreshHolders();
      await onDirectoryRefresh?.();
    } catch (err) {
      setError(err?.message || "Could not assign HOD.");
    } finally {
      setBusy(false);
    }
  };

  const handleRemoveHod = async (holder) => {
    if (!window.confirm(`Remove ${holder.fullName || holder.email} from ${dept.name}?`)) return;
    setError("");
    try {
      await removeRoleAssignment({ roleType: "HOD", scopeId: dept.id });
      await refreshHolders();
      await onDirectoryRefresh?.();
    } catch (err) {
      setError(err?.message || "Could not remove HOD.");
    }
  };

  return (
    <div style={{ position: "relative", display: "grid", gridTemplateColumns: "minmax(0,1.3fr) minmax(0,1.4fr) auto", alignItems: "center", gap: 14, padding: "13px 16px", borderBottom: "1px solid #f1f5f9" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <span style={{ width: 30, height: 30, borderRadius: 9, background: "#ecfeff", color: "#0891b2", border: "1px solid #cffafe", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, flexShrink: 0 }}>{dept.name.slice(0, 1).toUpperCase()}</span>
        <span style={{ fontSize: 13.5, fontWeight: 800, color: "#0f172a", overflowWrap: "anywhere" }}>{dept.name}</span>
      </div>

      <div>
        {loadingHolders ? (
          <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 700 }}>Loading...</span>
        ) : holders.length === 0 ? (
          <span style={{ display: "inline-flex", alignItems: "center", borderRadius: 999, padding: "5px 11px", background: "#f1f5f9", color: "#94a3b8", border: "1px solid #e2e8f0", fontSize: 11.5, fontWeight: 800 }}>Unassigned</span>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {holders.map((holder) => (
              <span key={holder.assignmentId || holder.email} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: 999, padding: "3px 6px 3px 3px" }}>
                <span style={{ width: 20, height: 20, borderRadius: 999, background: "#4338ca", color: "#fff", fontSize: 9, fontWeight: 900, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{initialsFor(holder.fullName || holder.email)}</span>
                <span style={{ fontSize: 11.5, fontWeight: 800, color: "#1e293b" }}>{holder.fullName || holder.email}</span>
                <button type="button" onClick={() => handleRemoveHod(holder)} title="Remove" style={{ border: "none", background: "transparent", color: "#94a3b8", cursor: "pointer", fontWeight: 900, fontSize: 12, padding: "0 2px", fontFamily: "inherit" }}>X</button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, justifySelf: "end" }}>
        <button
          type="button"
          onClick={() => setPopoverOpen((v) => !v)}
          disabled={busy}
          style={{ border: `1px solid #c7d2fe`, background: "#eef2ff", color: "#4338ca", borderRadius: 8, padding: "7px 12px", fontWeight: 800, fontSize: 11.5, cursor: busy ? "wait" : "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}
        >
          {holders.length > 0 ? "Change" : "Assign"}
        </button>
        <button
          type="button"
          onClick={() => onRemoveProgram(dept)}
          style={{ border: "1px solid #fecaca", background: "#fff5f5", color: "#dc2626", borderRadius: 8, padding: "7px 10px", fontWeight: 800, fontSize: 11.5, cursor: "pointer", fontFamily: "inherit" }}
          title={`Remove this ${unitLabelLower}`}
        >
          Remove
        </button>
      </div>
      {error && (
        <div style={{ gridColumn: "1 / -1", fontSize: 11.5, color: "#991b1b", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 7, padding: "6px 10px", marginTop: 6 }}>{error}</div>
      )}
      {popoverOpen && (
        <AssignPopover
          availableHods={availableHods}
          onPick={handlePick}
          onCreateNew={() => { setPopoverOpen(false); onCreateNewFor(dept.name); }}
          onClose={() => setPopoverOpen(false)}
        />
      )}
    </div>
  );
}

// Director-only panel for managing the department/program list of their own school, and which
// HOD (if any) owns each one. SoEMR is organized into departments (one HOD per department);
// every other school is organized into programs, where one HOD can be assigned to several
// programs at once - see backend_changes_requied.md / New_backend.md.
export default function ManageDepartmentsPanel({ school }) {
  const isDepartmentSchool = isSoemrSchool(school);
  const unitLabel = isDepartmentSchool ? "Department" : "Program";
  const unitLabelLower = unitLabel.toLowerCase();

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [existingHods, setExistingHods] = useState([]);
  const [error, setError] = useState("");

  const [addProgramOpen, setAddProgramOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [savingProgram, setSavingProgram] = useState(false);

  const [createHodFor, setCreateHodFor] = useState(null); // null | "" (unassigned) | program name

  const refresh = useCallback(async () => {
    if (!school) return;
    setLoading(true);
    try {
      const [departmentList, hodList] = await Promise.all([listSchoolDepartments(school), fetchSchoolHods(school)]);
      setDepartments(departmentList);
      setExistingHods(hodList);
    } catch (err) {
      setError(err?.message || `Could not load ${unitLabelLower}s.`);
    } finally {
      setLoading(false);
    }
  }, [school, unitLabelLower]);

  useEffect(() => {
    const timer = setTimeout(refresh, 0);
    return () => clearTimeout(timer);
  }, [refresh]);

  const handleAddProgram = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setSavingProgram(true);
    setError("");
    try {
      await addSchoolDepartment(school, newName.trim());
      setNewName("");
      setAddProgramOpen(false);
      await refresh();
    } catch (err) {
      setError(err?.message || `Could not add ${unitLabelLower}.`);
    } finally {
      setSavingProgram(false);
    }
  };

  const handleRemoveProgram = async (department) => {
    if (!window.confirm(`Remove "${department.name}"? Faculty/HOD already assigned to it will be affected.`)) return;
    setError("");
    try {
      await removeSchoolDepartment(school, department.id);
      await refresh();
    } catch (err) {
      setError(err?.message || `Could not remove ${unitLabelLower}.`);
    }
  };

  const assignedHodCount = existingHods.filter((h) => hodPrograms(h).length > 0).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%", boxSizing: "border-box" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", background: "#fff", borderRadius: 16, padding: "18px 22px", boxShadow: "0 12px 32px rgba(15,23,42,0.06)", border: "1px solid #e5e7eb" }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#0f172a" }}>{unitLabel}s & HODs</div>
          <div style={{ fontSize: 12.5, color: "#64748b", marginTop: 3 }}>
            {departments.length} {unitLabelLower}{departments.length === 1 ? "" : "s"} · {existingHods.length} HOD{existingHods.length === 1 ? "" : "s"} · {assignedHodCount} assigned
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" onClick={() => setCreateHodFor("")} style={{ border: "1px solid #c7d2fe", background: "#eef2ff", color: "#4338ca", borderRadius: 10, padding: "10px 16px", fontWeight: 800, fontSize: 12.5, cursor: "pointer", fontFamily: "inherit" }}>
            + Create HOD
          </button>
          <button type="button" onClick={() => setAddProgramOpen(true)} style={{ border: "none", background: "#0f766e", color: "#fff", borderRadius: 10, padding: "10px 16px", fontWeight: 800, fontSize: 12.5, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 10px 20px rgba(15,118,110,0.2)" }}>
            + Add {unitLabel}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", padding: "10px 14px", borderRadius: 10, fontSize: 12.5, fontWeight: 700 }}>{error}</div>
      )}

      {/* Table - overflow left visible (not hidden) so each row's "Assign" popover can escape
          the table bounds instead of being clipped; the header/rows already sit on the same
          white background as the wrapper so the square corners this trades away aren't visible. */}
      <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 12px 30px rgba(15,23,42,0.05)", border: "1px solid #e2e8f0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.3fr) minmax(0,1.4fr) auto", gap: 14, padding: "11px 16px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", borderRadius: "14px 14px 0 0" }}>
          <span style={{ fontSize: 10.5, fontWeight: 900, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>{unitLabel}</span>
          <span style={{ fontSize: 10.5, fontWeight: 900, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>Assigned HOD</span>
          <span />
        </div>

        {loading ? (
          <div style={{ padding: "26px 16px", fontSize: 13, color: "#64748b", fontWeight: 700, textAlign: "center" }}>Loading {unitLabelLower}s...</div>
        ) : departments.length === 0 ? (
          <div style={{ padding: "36px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 13, color: "#64748b", fontWeight: 800, marginBottom: 10 }}>No {unitLabelLower}s added yet.</div>
            <button type="button" onClick={() => setAddProgramOpen(true)} style={{ border: "none", background: "#0f766e", color: "#fff", borderRadius: 9, padding: "9px 16px", fontWeight: 800, fontSize: 12.5, cursor: "pointer", fontFamily: "inherit" }}>
              + Add your first {unitLabelLower}
            </button>
          </div>
        ) : (
          departments.map((dept) => (
            <ProgramRow
              key={dept.id || dept.name}
              dept={dept}
              unitLabelLower={unitLabelLower}
              availableHods={existingHods}
              onRemoveProgram={handleRemoveProgram}
              onDirectoryRefresh={refresh}
              onCreateNewFor={(name) => setCreateHodFor(name)}
            />
          ))
        )}
      </div>

      {/* Add Program modal */}
      {addProgramOpen && (
        <Modal title={`Add ${unitLabel}`} subtitle={`New ${unitLabelLower}s become available for HOD assignment and Faculty signup immediately.`} onClose={() => setAddProgramOpen(false)}>
          <form onSubmit={handleAddProgram} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input
              autoFocus
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={isDepartmentSchool ? "e.g. Computer Science" : "e.g. B.Tech Computer Science"}
              maxLength={100}
              style={{ padding: "11px 13px", border: "1.5px solid #dbe3ef", borderRadius: 10, fontSize: 13.5, fontFamily: "inherit", outline: "none" }}
            />
            <button
              type="submit"
              disabled={savingProgram || !newName.trim()}
              style={{ alignSelf: "flex-start", padding: "10px 20px", background: "#0f766e", color: "#fff", border: "none", borderRadius: 10, fontWeight: 800, fontSize: 13, cursor: savingProgram || !newName.trim() ? "not-allowed" : "pointer", opacity: savingProgram || !newName.trim() ? 0.6 : 1, fontFamily: "inherit" }}
            >
              {savingProgram ? "Adding..." : `Add ${unitLabel}`}
            </button>
          </form>
        </Modal>
      )}

      {/* Create HOD modal */}
      {createHodFor !== null && (
        <Modal title="Create HOD Account" subtitle={createHodFor ? `Will be assigned to ${createHodFor} once created.` : `Create the account, then assign a ${unitLabelLower} from the table.`} onClose={() => setCreateHodFor(null)}>
          <CreateHodForm
            school={school}
            departmentName={createHodFor}
            accent="#4338ca"
            onCreated={async () => {
              setCreateHodFor(null);
              await refresh();
            }}
          />
        </Modal>
      )}
    </div>
  );
}
