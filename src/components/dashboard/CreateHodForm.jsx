import { useMemo, useState } from "react";
import { register } from "../../services/authService";
import { buildProfilePayload } from "../../auth/session";
import { transferRole } from "../../services/roleAssignmentsService";
import { isValidEmail, isValidEmployeeId, isValidName, passwordRequirements, sanitizeText, normalizeEmail } from "../../utils/validation";

function FieldIcon({ paths, size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths.map((d) => <path key={d} d={d} />)}
    </svg>
  );
}

const ICONS = {
  user: ["M20 21a8 8 0 0 0-16 0", "M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"],
  mail: ["M4 4h16v16H4z", "m22 6-10 7L2 6"],
  id: ["M4 5h16v14H4z", "M8 9h4", "M8 13h8", "M8 17h5", "M15 9h1"],
  briefcase: ["M10 6V5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v1", "M3 7h18v12H3z", "M3 12h18"],
  lock: ["M5 11h14v10H5z", "M8 11V7a4 4 0 0 1 8 0v4"],
  eye: ["M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z", "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"],
  eyeOff: ["M9.9 4.24A9.4 9.4 0 0 1 12 4c7 0 11 7 11 7a13.6 13.6 0 0 1-2.9 3.9M6.6 6.6A13.5 13.6 0 0 0 1 11s4 7 11 7a9.5 9.5 0 0 0 5.1-1.5", "M9.9 9.9a3 3 0 0 0 4.2 4.2", "M2 2l20 20"],
  check: ["M20 6 9 17l-5-5"],
  sparkle: ["M12 3v4", "M12 17v4", "M3 12h4", "M17 12h4", "m5.6 5.6 2.8 2.8", "m15.6 15.6 2.8 2.8", "m18.4 5.6-2.8 2.8", "m8.4 15.6-2.8 2.8"],
  layers: ["m12 2 9 5-9 5-9-5 9-5Z", "m3 12 9 5 9-5", "m3 17 9 5 9-5"],
  chevronDown: ["m6 9 6 6 6-6"],
};

function Field({ icon, label, children }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
      <span style={{ fontSize: 10.5, fontWeight: 800, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
      <div className="chf-field" style={{ display: "flex", alignItems: "center", minWidth: 0, height: 46, border: "1.5px solid #e2e8f0", borderRadius: 11, background: "#fff", overflow: "hidden", transition: "border-color .15s, box-shadow .15s" }}>
        <span style={{ width: 40, height: "100%", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", background: "#f8fafc", borderRight: "1px solid #eef2f7", flexShrink: 0 }}>
          <FieldIcon paths={icon} />
        </span>
        {children}
      </div>
    </label>
  );
}

const inputStyle = { flex: "1 1 0%", width: "100%", height: "100%", border: "none", outline: "none", padding: "0 13px", fontSize: 13.5, fontFamily: "inherit", color: "#0f172a", background: "transparent", minWidth: 0, boxSizing: "border-box" };

// Closed-by-default dropdown that expands into a checkbox list - lets a Director pick any
// number of programs without the picker eating vertical space until they actually open it.
function ProgramMultiSelectDropdown({ departments, selectedDeptIds, onToggle, accent }) {
  const [open, setOpen] = useState(false);
  const selectedNames = departments.filter((d) => selectedDeptIds.includes(d.id)).map((d) => d.name);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
      <span style={{ fontSize: 10.5, fontWeight: 800, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 6 }}>
        <FieldIcon paths={ICONS.layers} size={13} />
        Assign to programs (optional)
      </span>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, width: "100%", boxSizing: "border-box", height: 46, padding: "0 14px", border: `1.5px solid ${open ? accent : "#e2e8f0"}`, borderRadius: 11, background: "#fff", cursor: "pointer", fontFamily: "inherit", boxShadow: open ? `0 0 0 3px ${accent}1F` : "none", transition: "border-color .15s, box-shadow .15s" }}
      >
        <span style={{ fontSize: 13.5, fontWeight: 700, color: selectedNames.length ? "#0f172a" : "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "left", minWidth: 0 }}>
          {selectedNames.length === 0 ? "Select programs..." : selectedNames.length === 1 ? selectedNames[0] : `${selectedNames.length} programs selected`}
        </span>
        <span style={{ color: "#94a3b8", flexShrink: 0, display: "inline-flex", transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }}>
          <FieldIcon paths={ICONS.chevronDown} size={15} />
        </span>
      </button>

      {/* In normal document flow (not position:absolute) so opening it grows the modal's own
          scroll area instead of floating a fixed-height panel that can spill past the modal's
          rounded card - the modal already scrolls (see Modal's overflowY: auto), so this just
          participates in that instead of fighting it. */}
      {open && (
        <div style={{ background: "#fbfcfd", border: "1px solid #e2e8f0", borderRadius: 12, padding: 8, maxHeight: 280, overflowY: "auto", overflowX: "hidden" }}>
          {departments.map((dept) => {
            const checked = selectedDeptIds.includes(dept.id);
            return (
              <label
                key={dept.id}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#1e293b" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#f8fafc"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <input type="checkbox" checked={checked} onChange={() => onToggle(dept.id)} style={{ display: "none" }} />
                <span style={{ width: 17, height: 17, borderRadius: 5, border: `1.5px solid ${checked ? accent : "#cbd5e1"}`, background: checked ? accent : "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background .15s, border-color .15s" }}>
                  {checked && <FieldIcon paths={ICONS.check} size={11} />}
                </span>
                {dept.name}
              </label>
            );
          })}
          <div style={{ borderTop: "1px solid #eef2f7", marginTop: 6, paddingTop: 6 }}>
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{ width: "100%", border: "none", background: "transparent", color: accent, fontWeight: 800, fontSize: 12.5, padding: "7px 8px", cursor: "pointer", fontFamily: "inherit", borderRadius: 8 }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Lets a Director create a brand-new HOD account for their school instead of requiring that
// person to self-register via Signup first. Account creation reuses the same
// POST /auth/register endpoint Signup already calls - no new backend endpoint needed there.
// Assigning the chosen programs afterward reuses POST /role-assignments/transfer, the same
// call the "Assign a program" control on each HOD's card uses - one call per selected program,
// since a single HOD can cover several at once.
export default function CreateHodForm({ school, departments = [], onCreated, accent = "#0f766e" }) {
  const [form, setForm] = useState({ name: "", email: "", employeeId: "", designation: "", password: "" });
  const [selectedDeptIds, setSelectedDeptIds] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggleDept = (id) => {
    setSelectedDeptIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const pwChecks = useMemo(() => {
    const unmet = new Set(passwordRequirements(form.password));
    return [
      { key: "At least 8 characters", met: !unmet.has("At least 8 characters") },
      { key: "One uppercase letter", met: !unmet.has("One uppercase letter") },
      { key: "One lowercase letter", met: !unmet.has("One lowercase letter") },
      { key: "One number", met: !unmet.has("One number") },
    ];
  }, [form.password]);
  const pwValid = form.password.length > 0 && pwChecks.every((c) => c.met);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!isValidName(form.name)) { setError("Please enter a valid name (2-100 characters)."); return; }
    if (!isValidEmail(form.email)) { setError("Please enter a valid email address."); return; }
    if (!isValidEmployeeId(form.employeeId)) { setError("Employee ID must be 2-30 characters (letters, numbers, / - _)."); return; }
    if (!form.designation.trim()) { setError("Designation is required."); return; }
    if (!pwValid) { setError("Password doesn't meet the requirements below."); return; }

    setSaving(true);
    try {
      const email = normalizeEmail(form.email);
      const chosenDepts = departments.filter((d) => selectedDeptIds.includes(d.id));
      const profilePayload = buildProfilePayload({
        email,
        name: sanitizeText(form.name),
        employeeId: sanitizeText(form.employeeId),
        designation: sanitizeText(form.designation),
        role: "hod",
        school,
        department: chosenDepts[0]?.name || "",
        departments: chosenDepts.map((d) => d.name),
      });
      await register(profilePayload, form.password);

      // Account creation succeeding doesn't guarantee every assignment call below does too -
      // run them independently and report any that failed, rather than losing the whole
      // picture behind a single try/catch (the account itself is already created either way).
      const failedAssignments = [];
      for (const dept of chosenDepts) {
        try {
          await transferRole({ roleType: "HOD", scopeId: dept.id, incomingEmail: email });
        } catch {
          failedAssignments.push(dept.name);
        }
      }

      setForm({ name: "", email: "", employeeId: "", designation: "", password: "" });
      setSelectedDeptIds([]);
      if (failedAssignments.length > 0) {
        setMessage(`HOD account created. Could not assign: ${failedAssignments.join(", ")} - try assigning ${failedAssignments.length === 1 ? "it" : "them"} from the HOD's card.`);
      } else if (chosenDepts.length > 0) {
        setMessage(`HOD account created and assigned to ${chosenDepts.map((d) => d.name).join(", ")}.`);
      } else {
        setMessage("HOD account created. Assign a program from the HOD's card below.");
      }
      onCreated?.();
    } catch (err) {
      setError(err?.message || "Could not create HOD account.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20, minWidth: 0 }}>
      <style>{`
        .chf-field:hover { border-color: #cbd5e1; }
        .chf-field:focus-within { border-color: ${accent} !important; box-shadow: 0 0 0 3px ${accent}1F; }
        .chf-submit:hover:not(:disabled) { filter: brightness(1.08); transform: translateY(-1px); box-shadow: 0 12px 22px ${accent}38; }
        .chf-submit:active:not(:disabled) { transform: translateY(0); }
        .chf-eye:hover { color: #475569 !important; }
      `}</style>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 16 }}>
        <Field icon={ICONS.user} label="Full name">
          <input name="name" placeholder="e.g. Dr. Anjali Rao" value={form.name} onChange={handleChange} style={inputStyle} />
        </Field>
        <Field icon={ICONS.mail} label="Email">
          <input name="email" type="email" placeholder="name@dypiu.ac.in" value={form.email} onChange={handleChange} style={inputStyle} />
        </Field>
        <Field icon={ICONS.id} label="Employee ID">
          <input name="employeeId" placeholder="EMP001" value={form.employeeId} onChange={handleChange} maxLength={30} style={inputStyle} />
        </Field>
        <Field icon={ICONS.briefcase} label="Designation">
          <input name="designation" placeholder="Associate Professor" value={form.designation} onChange={handleChange} maxLength={100} style={inputStyle} />
        </Field>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <Field icon={ICONS.lock} label="Temporary password">
          <input name="password" type={showPassword ? "text" : "password"} placeholder="Create a temporary password" value={form.password} onChange={handleChange} autoComplete="new-password" style={inputStyle} />
          <button
            type="button"
            className="chf-eye"
            onClick={() => setShowPassword((v) => !v)}
            title={showPassword ? "Hide password" : "Show password"}
            style={{ width: 38, height: "100%", flexShrink: 0, border: "none", borderLeft: "1px solid #eef2f7", background: "transparent", color: "#94a3b8", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
          >
            <FieldIcon paths={showPassword ? ICONS.eyeOff : ICONS.eye} size={15} />
          </button>
        </Field>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "5px 12px", padding: "2px 2px 0" }}>
          {pwChecks.map((c) => (
            <span key={c.key} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10.5, fontWeight: 700, color: c.met ? "#059669" : "#9ca3af", transition: "color .15s" }}>
              <span style={{ width: 13, height: 13, borderRadius: 999, background: c.met ? "#dcfce7" : "#f1f5f9", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background .15s" }}>
                {c.met && <FieldIcon paths={ICONS.check} size={9} />}
              </span>
              {c.key}
            </span>
          ))}
        </div>
      </div>

      {departments.length > 0 && (
        <ProgramMultiSelectDropdown
          departments={departments}
          selectedDeptIds={selectedDeptIds}
          onToggle={toggleDept}
          accent={accent}
        />
      )}

      <div style={{ fontSize: 11, color: "#94a3b8", display: "flex", alignItems: "flex-start", gap: 6, lineHeight: 1.5 }}>
        <span style={{ marginTop: 1, flexShrink: 0 }}><FieldIcon paths={ICONS.sparkle} size={13} /></span>
        <span>
          The account is created for <strong style={{ color: "#64748b" }}>{school}</strong> only.
          {selectedDeptIds.length > 0
            ? <> They'll be immediately assigned to <strong style={{ color: "#64748b" }}>{departments.filter((d) => selectedDeptIds.includes(d.id)).map((d) => d.name).join(", ")}</strong>.</>
            : " You can assign a program now above, or later from the HOD's card."}
        </span>
      </div>

      {error && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12.5, fontWeight: 600, color: "#991b1b", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 12px" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
          {error}
        </div>
      )}
      {message && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12.5, fontWeight: 600, color: "#065f46", background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 10, padding: "10px 12px" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" style={{ flexShrink: 0, marginTop: 1 }}><path d="M20 6 9 17l-5-5" /></svg>
          {message}
        </div>
      )}

      <button
        type="submit"
        className="chf-submit"
        disabled={saving}
        style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, alignSelf: "flex-start", padding: "11px 22px", background: accent, color: "#fff", border: "none", borderRadius: 11, fontWeight: 800, fontSize: 13, cursor: saving ? "wait" : "pointer", opacity: saving ? 0.7 : 1, fontFamily: "inherit", boxShadow: `0 8px 18px ${accent}2E`, transition: "filter .15s, transform .15s, box-shadow .15s" }}
      >
        {saving ? (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "chf-spin 0.8s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
            Creating account...
          </>
        ) : (
          <>
            {selectedDeptIds.length > 0 ? "Create & assign HOD" : "Create HOD account"}
            <FieldIcon paths={["M5 12h14", "m12 5 7 7-7 7"]} size={14} />
          </>
        )}
      </button>
      <style>{`@keyframes chf-spin { to { transform: rotate(360deg); } }`}</style>
    </form>
  );
}
