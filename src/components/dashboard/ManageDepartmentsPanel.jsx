import { useState, useEffect, useCallback } from "react";
import { listSchoolDepartments, addSchoolDepartment, removeSchoolDepartment } from "../../services/departmentsService";
import RoleTransferForm from "./RoleTransferForm";

// Director-only panel for managing the department list of their own school.
// Faculty/HOD signup and appraisal routing both read from this same list.
export default function ManageDepartmentsPanel({ school }) {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [transferOpenId, setTransferOpenId] = useState("");

  const refresh = useCallback(async () => {
    if (!school) return;
    setLoading(true);
    try {
      setDepartments(await listSchoolDepartments(school));
    } catch (err) {
      setError(err?.message || "Could not load departments.");
    } finally {
      setLoading(false);
    }
  }, [school]);

  useEffect(() => {
    const timer = setTimeout(refresh, 0);
    return () => clearTimeout(timer);
  }, [refresh]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    setError("");
    try {
      await addSchoolDepartment(school, newName.trim());
      setNewName("");
      await refresh();
    } catch (err) {
      setError(err?.message || "Could not add department.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (department) => {
    if (!window.confirm(`Remove "${department.name}"? Faculty/HOD already assigned to it will be affected.`)) return;
    setError("");
    try {
      await removeSchoolDepartment(school, department.id);
      await refresh();
    } catch (err) {
      setError(err?.message || "Could not remove department.");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 860 }}>
      <div className="fa-slide-top" style={{ display: "flex", alignItems: "center", gap: 16, background: "#fff", borderRadius: 14, padding: "16px 24px", boxShadow: "0 10px 28px rgba(17,24,39,0.06)", border: "1px solid #e5e7eb", flexWrap: "wrap" }}>
        <div style={{ width: 48, height: 48, borderRadius: 13, background: "linear-gradient(135deg,#ccfbf1,#99f6e4)", color: "#0f766e", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m12 3 9 5-9 5-9-5 9-5Z" />
            <path d="M5 10.5V16c0 1.5 3.13 3 7 3s7-1.5 7-3v-5.5" />
            <path d="M21 9v6.5" />
          </svg>
        </div>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "#0f172a", letterSpacing: -0.4 }}>Manage Departments</h1>
          <p style={{ margin: "3px 0 0", fontSize: 12.5, color: "#64748b", lineHeight: 1.5 }}>
            Departments you add here become available for HOD accounts and Faculty signup in your
            school. Each department also gets its own HOD transfer control below.
          </p>
        </div>
      </div>

      <div className="fa-fade-up" style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.03)", overflow: "hidden", border: "1px solid #e2e8f0" }}>
        <div style={{ padding: "18px 24px 4px" }}>
          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", padding: "10px 14px", borderRadius: 8, fontSize: 12, marginBottom: 16 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleAdd} style={{ display: "flex", gap: 8, marginBottom: 18 }}>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Computer Science"
              maxLength={100}
              style={{ flex: 1, padding: "10px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, fontFamily: "inherit", outline: "none" }}
            />
            <button
              type="submit"
              disabled={saving || !newName.trim()}
              style={{ padding: "10px 18px", background: "#0f766e", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: saving || !newName.trim() ? "not-allowed" : "pointer", opacity: saving || !newName.trim() ? 0.6 : 1, fontFamily: "inherit" }}
            >
              {saving ? "Adding..." : "Add"}
            </button>
          </form>
        </div>

        <div style={{ padding: "0 24px 22px" }}>
          {loading ? (
            <div style={{ fontSize: 13, color: "#64748b" }}>Loading departments...</div>
          ) : departments.length === 0 ? (
            <div style={{ fontSize: 13, color: "#64748b" }}>No departments added yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {departments.map((dept) => {
                const isTransferOpen = transferOpenId === dept.id;
                return (
                  <div key={dept.id || dept.name} style={{ border: "1px solid #e2e8f0", borderRadius: 8, background: "#fbfcfd", overflow: "hidden" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px" }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{dept.name}</span>
                      <div style={{ display: "flex", gap: 14 }}>
                        <button
                          type="button"
                          onClick={() => setTransferOpenId(isTransferOpen ? "" : dept.id)}
                          style={{ border: "none", background: "transparent", color: "#0f766e", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
                        >
                          {isTransferOpen ? "Close" : "Transfer HOD"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemove(dept)}
                          style={{ border: "none", background: "transparent", color: "#dc2626", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    {isTransferOpen && (
                      <div style={{ padding: "0 14px 14px" }}>
                        <RoleTransferForm roleType="HOD" scopeId={dept.id} roleLabel="HOD" accent="#0f766e" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
