import { useState } from "react";
import { register } from "../../services/authService";
import { buildProfilePayload } from "../../auth/session";
import { isValidEmail, isValidEmployeeId, isValidName, passwordRequirements, sanitizeText, normalizeEmail } from "../../utils/validation";

// Lets a Director create a brand-new HOD account for their school instead of requiring that
// person to self-register via Signup first. Reuses the same
// POST /auth/register endpoint Signup already calls - no new backend endpoint needed.
export default function CreateHodForm({ school, departmentName = "", onCreated, accent = "#0f766e" }) {
  const [form, setForm] = useState({ name: "", email: "", employeeId: "", designation: "", password: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!isValidName(form.name)) { setError("Please enter a valid name (2-100 characters)."); return; }
    if (!isValidEmail(form.email)) { setError("Please enter a valid email address."); return; }
    if (!isValidEmployeeId(form.employeeId)) { setError("Employee ID must be 2-30 characters (letters, numbers, / - _)."); return; }
    if (!form.designation.trim()) { setError("Designation is required."); return; }
    const pwErrors = passwordRequirements(form.password);
    if (pwErrors.length) { setError(`Password needs: ${pwErrors.join(", ")}.`); return; }

    setSaving(true);
    try {
      const profilePayload = buildProfilePayload({
        email: normalizeEmail(form.email),
        name: sanitizeText(form.name),
        employeeId: sanitizeText(form.employeeId),
        designation: sanitizeText(form.designation),
        role: "hod",
        school,
        department: departmentName,
        departments: departmentName ? [departmentName] : [],
      });
      await register(profilePayload, form.password);
      setForm({ name: "", email: "", employeeId: "", designation: "", password: "" });
      setMessage(departmentName ? `HOD account created and assigned to ${departmentName}.` : "HOD account created. Assign a program from the list below.");
      onCreated?.();
    } catch (err) {
      setError(err?.message || "Could not create HOD account.");
    } finally {
      setSaving(false);
    }
  };

  const fieldStyle = { padding: "8px 10px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 12.5, fontFamily: "inherit", outline: "none", width: "100%", boxSizing: "border-box" };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 10, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {departmentName ? `Create HOD for ${departmentName}` : "Create HOD account"}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <input name="name" placeholder="Full name" value={form.name} onChange={handleChange} style={fieldStyle} />
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} style={fieldStyle} />
        <input name="employeeId" placeholder="Employee ID" value={form.employeeId} onChange={handleChange} maxLength={30} style={fieldStyle} />
        <input name="designation" placeholder="Designation (e.g. Associate Professor)" value={form.designation} onChange={handleChange} maxLength={100} style={fieldStyle} />
        <input name="password" type="password" placeholder="Temporary password" value={form.password} onChange={handleChange} autoComplete="new-password" style={{ ...fieldStyle, gridColumn: "1 / -1" }} />
      </div>
      <div style={{ fontSize: 10.5, color: "#9ca3af" }}>Min 8 characters, one uppercase, one lowercase, one number. The account is created for this school only; assign a program separately after creation.</div>

      {error && (
        <div style={{ fontSize: 12, color: "#991b1b", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "8px 10px" }}>{error}</div>
      )}
      {message && (
        <div style={{ fontSize: 12, color: "#065f46", background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 8, padding: "8px 10px" }}>{message}</div>
      )}

      <button
        type="submit"
        disabled={saving}
        style={{ alignSelf: "flex-start", padding: "8px 16px", background: accent, color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 12.5, cursor: saving ? "wait" : "pointer", opacity: saving ? 0.65 : 1, fontFamily: "inherit" }}
      >
        {saving ? "Creating..." : departmentName ? "Create & Assign HOD" : "Create HOD"}
      </button>
    </form>
  );
}
