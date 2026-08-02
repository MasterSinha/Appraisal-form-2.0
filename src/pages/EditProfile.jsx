/* eslint-disable no-unused-vars */
import { cloneElement, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { APP_INFO } from "../constants/formConfig";
import {
  SCHOOL_OPTIONS,
  SOEMR_DEPARTMENTS,
  canonicalDepartmentValue,
  canonicalSchoolValue,
  isCisrSchool,
  isSoemrSchool,
  isValidSchool,
  isValidSoemrDepartment,
} from "../constants/universityHierarchy";
import { isNonTeachingRole } from "../constants/nonTeachingHierarchy";
import { buildProfilePayload, normalizeRole, storeUserSession } from "../auth/session";
import { updateProfile } from "../services/authService";
import {
  isValidPhone, isValidName, isValidEmployeeId, isValidExperience,
  sanitizeText, filterNumeric, filterPhone,
} from "../utils/validation";

// - Pseudo-class styles (hover / focus) injected once on mount -
const EP_CSS = `
  .ep-inp { transition: border-color .15s, box-shadow .15s; }
  .ep-inp:hover:not(:disabled) { border-color: #93c5fd; }
  .ep-inp:focus { outline: none; border-color: #2563eb !important; box-shadow: 0 0 0 3px rgba(37,99,235,.10) !important; }
  .ep-input-shell { transition: border-color .15s, box-shadow .15s; }
  .ep-input-shell:hover { border-color: #93c5fd !important; }
  .ep-input-shell:focus-within { border-color: #2563eb !important; box-shadow: 0 0 0 3px rgba(37,99,235,.10) !important; }
  .ep-cancel:hover { background: #f8fafc !important; border-color: #94a3b8 !important; color: #0f172a !important; }
  .ep-save:hover:not(:disabled) { background: #1d4ed8 !important; box-shadow: 0 4px 14px rgba(37,99,235,.35) !important; }
  .ep-save:active:not(:disabled) { transform: translateY(1px); }
  .ep-back:hover { color: #2563eb !important; }
  .ep-photo-btn:hover { border-color: #2563eb !important; color: #2563eb !important; background: #eff6ff !important; }
  .ep-edit-hero:hover { background: #eff6ff !important; border-color: #93c5fd !important; }
  @media (max-width: 980px) {
    .ep-hero { grid-template-columns: 1fr !important; }
    .ep-stat-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; border-left: none !important; padding-left: 0 !important; }
    .ep-profile-cards { grid-template-columns: 1fr !important; }
    .ep-page { height: auto !important; overflow-y: auto !important; }
  }
  @media (max-width: 620px) {
    .ep-grid, .ep-stat-grid { grid-template-columns: 1fr !important; }
    .ep-hero-left { flex-direction: column !important; align-items: flex-start !important; }
  }
`;

function CssInjector() {
  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = EP_CSS;
    el.setAttribute("data-ep", "1");
    document.head.appendChild(el);
    return () => el.remove();
  }, []);
  return null;
}

// - Constants -
const ROLE_LABEL = {
  faculty: "Faculty",
  hod: "Head of Department",
  center_head: "Center Head",
  non_teaching_staff: "Non-Teaching Staff",
  reporting_officer: "Reporting Officer",
  registrar: "Registrar",
  director: "Director",
  dean: "Dean",
  vc: "Vice Chancellor",
};

const BASE_ROLE_OPTIONS = [
  { value: "faculty", label: "Faculty" },
  { value: "hod", label: "HOD" },
  { value: "center_head", label: "Center Head" },
  { value: "dean", label: "Dean" },
  { value: "director", label: "Director" },
  { value: "vc", label: "Vice Chancellor" },
  { value: "registrar", label: "Registrar" },
  { value: "reporting_officer", label: "Reporting Officer" },
  { value: "non_teaching_staff", label: "Non-Teaching Staff" },
];

const STAFF_TYPE_LABEL = { teaching: "Teaching", non_teaching: "Non-Teaching" };

const initialsFromName = (name = "") =>
  String(name || "U").trim().split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "U";

// - Sub-components -
const ICONS = {
  users: ["M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z", "M22 21v-2a4 4 0 0 0-3-3.87", "M16 3.13a4 4 0 0 1 0 7.75"],
  user: ["M20 21a8 8 0 0 0-16 0", "M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"],
  id: ["M4 5h16v14H4z", "M8 9h4", "M8 13h8", "M8 17h5", "M15 9h1"],
  cap: ["M22 10 12 5 2 10l10 5 10-5Z", "M6 12v5c3 2 9 2 12 0v-5"],
  briefcase: ["M10 6V5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v1", "M3 7h18v12H3z", "M3 12h18"],
  clock: ["M12 8v5l3 2", "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"],
  calendar: ["M8 2v4", "M16 2v4", "M3 10h18", "M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2Z"],
  shield: ["M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z", "m9 12 2 2 4-4"],
  phone: ["M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.63a2 2 0 0 1-.45 2.11L8 9.7a16 16 0 0 0 6.3 6.3l1.24-1.23a2 2 0 0 1 2.11-.45c.85.29 1.73.5 2.63.62A2 2 0 0 1 22 16.92Z"],
  building: ["M3 21h18", "M6 21V7l8-4v18", "M18 21V9l-4-2", "M9 9h1", "M9 13h1", "M9 17h1"],
  edit: ["M12 20h9", "M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"],
};

function IconGlyph({ name, size = 18, strokeWidth = 2.2 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {(ICONS[name] || ICONS.user).map((d) => <path key={d} d={d} />)}
    </svg>
  );
}

function SoftIcon({ name, color = "#2563eb", bg = "#eff6ff", size = 46 }) {
  return (
    <span style={{ width: size, height: size, borderRadius: size > 42 ? 16 : 12, background: bg, color, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "inset 0 0 0 1px rgba(37,99,235,0.08)" }}>
      <IconGlyph name={name} size={Math.round(size * 0.45)} />
    </span>
  );
}

function HeroStat({ icon, label, value, color = "#2563eb", bg = "#eef2ff" }) {
  return (
    <div style={{ minHeight: 72, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 7, textAlign: "center", borderLeft: "1px solid #e5e7eb", padding: "0 18px" }}>
      <SoftIcon name={icon} color={color} bg={bg} size={38} />
      <div style={{ display: "grid", gap: 3 }}>
        <div style={{ fontSize: 10, fontWeight: 900, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.6 }}>{label}</div>
        <div style={{ color: label === "Account Status" ? "#22c55e" : "#111827", fontSize: 14, fontWeight: 900, whiteSpace: "nowrap" }}>{value || "-"}</div>
      </div>
    </div>
  );
}

function SectionHead({ title, badge, badgeColor = "#64748b", badgeBack = "#f1f5f9", icon = "user", iconColor = "#2563eb", iconBg = "#eff6ff", actions }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, marginBottom: 22 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <SoftIcon name={icon} color={iconColor} bg={iconBg} size={44} />
        <span style={{ fontSize: 20, fontWeight: 900, color: "#0f172a", letterSpacing: 0 }}>{title}</span>
      </div>
      {actions || (
        <span style={{ fontSize: 10, fontWeight: 700, background: badgeBack, color: badgeColor, borderRadius: 20, padding: "3px 10px", letterSpacing: "0.04em", textTransform: "uppercase" }}>
          {badge}
        </span>
      )}
    </div>
  );
}

function IconInput({ icon, children }) {
  const input = cloneElement(children, {
    style: {
      ...children.props.style,
      height: 42,
      border: "none",
      borderRadius: 0,
      padding: "0 12px",
      background: "transparent",
      boxShadow: "none",
      outline: "none",
    },
  });

  return (
    <div className="ep-input-shell" style={{ height: 42, display: "flex", alignItems: "center", border: "1.5px solid #dbe3ef", borderRadius: 9, background: "#fff", overflow: "hidden" }}>
      <span style={{ width: 42, height: "100%", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#64748b", background: "#f8fafc", borderRight: "1px solid #e5e7eb", flexShrink: 0 }}>
        <IconGlyph name={icon} size={17} />
      </span>
      {input}
    </div>
  );
}

function FrozenField({ label, value, wide }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, ...(wide ? { gridColumn: "1 / -1" } : {}) }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
      <div style={{ minHeight: 40, display: "flex", alignItems: "center", background: "#f9fafb", border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "0 13px", fontSize: 13, color: value ? "#4b5563" : "#c4c9d4" }}>
        {value || "-"}
      </div>
    </div>
  );
}

function createAdjustedProfileImage(src, { zoom, x, y }, outputSize = 480) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = outputSize;
      canvas.height = outputSize;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Unable to prepare the profile image."));
        return;
      }

      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(0, 0, outputSize, outputSize);

      const baseScale = Math.max(outputSize / image.naturalWidth, outputSize / image.naturalHeight);
      const scale = baseScale * zoom;
      const drawWidth = image.naturalWidth * scale;
      const drawHeight = image.naturalHeight * scale;
      const offsetX = (x / 100) * (outputSize / 2);
      const offsetY = (y / 100) * (outputSize / 2);
      const drawX = (outputSize - drawWidth) / 2 + offsetX;
      const drawY = (outputSize - drawHeight) / 2 + offsetY;

      ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
      resolve(canvas.toDataURL("image/jpeg", 0.92));
    };
    image.onerror = () => reject(new Error("Unable to load the selected image."));
    image.src = src;
  });
}

function PhotoAdjustModal({ src, adjust, setAdjust, onCancel, onApply }) {
  const setValue = (field) => (event) => {
    const value = Number(event.target.value);
    setAdjust((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(15,23,42,0.62)", display: "grid", placeItems: "center", padding: 24 }} onClick={onCancel}>
      <div style={{ width: "min(520px, 94vw)", background: "#fff", borderRadius: 18, border: "1px solid #e5e7eb", boxShadow: "0 24px 80px rgba(15,23,42,0.28)", padding: 22 }} onClick={(event) => event.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 18 }}>
          <div>
            <div style={{ color: "#0f172a", fontSize: 18, fontWeight: 900 }}>Adjust Profile Photo</div>
            <div style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>Position your photo inside the circle before saving.</div>
          </div>
          <button type="button" onClick={onCancel} style={{ width: 34, height: 34, borderRadius: 10, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#475569", cursor: "pointer", fontWeight: 900, fontFamily: "inherit" }}>X</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 22, alignItems: "center" }}>
          <div style={{ display: "grid", justifyItems: "center", gap: 10 }}>
            <div style={{ width: 170, height: 170, borderRadius: "50%", overflow: "hidden", background: "#e2e8f0", border: "5px solid #fff", boxShadow: "0 12px 32px rgba(15,23,42,0.16), 0 0 0 1px #e2e8f0" }}>
              <img
                src={src}
                alt="Profile preview"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                  transform: `translate(${adjust.x}%, ${adjust.y}%) scale(${adjust.zoom})`,
                  transformOrigin: "center",
                }}
              />
            </div>
            <div style={{ color: "#64748b", fontSize: 11, fontWeight: 700 }}>Circular preview</div>
          </div>

          <div style={{ display: "grid", gap: 14 }}>
            {[
              ["zoom", "Zoom", 0.6, 3, 0.05],
              ["x", "Move Left / Right", -70, 70, 1],
              ["y", "Move Up / Down", -70, 70, 1],
            ].map(([field, label, min, max, step]) => (
              <label key={field} style={{ display: "grid", gap: 7 }}>
                <span style={{ display: "flex", justifyContent: "space-between", color: "#334155", fontSize: 12, fontWeight: 850 }}>
                  {label}
                  <span style={{ color: "#64748b", fontWeight: 750 }}>{field === "zoom" ? `${Math.round(adjust.zoom * 100)}%` : adjust[field]}</span>
                </span>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={adjust[field]}
                  onChange={setValue(field)}
                  style={{ width: "100%", accentColor: "#2563eb" }}
                />
              </label>
            ))}

            <button
              type="button"
              onClick={() => setAdjust({ zoom: 1, x: 0, y: 0 })}
              style={{ justifySelf: "start", border: "1px solid #dbe3ef", background: "#f8fafc", color: "#475569", borderRadius: 9, height: 34, padding: "0 12px", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 800 }}
            >
              Reset Position
            </button>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 22, paddingTop: 16, borderTop: "1px solid #eef2f7" }}>
          <button type="button" onClick={onCancel} style={{ height: 38, border: "1px solid #dbe3ef", background: "#fff", color: "#475569", borderRadius: 9, padding: "0 16px", cursor: "pointer", fontFamily: "inherit", fontWeight: 800 }}>Cancel</button>
          <button type="button" onClick={onApply} style={{ height: 38, border: "none", background: "#2563eb", color: "#fff", borderRadius: 9, padding: "0 18px", cursor: "pointer", fontFamily: "inherit", fontWeight: 900 }}>Use Photo</button>
        </div>
      </div>
    </div>
  );
}

function InputField({ label, required, hint, wide, children }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 5, ...(wide ? { gridColumn: "1 / -1" } : {}) }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
        {required && <span style={{ color: "#ef4444", marginLeft: 2 }}>*</span>}
      </span>
      {children}
      {hint && <span style={{ fontSize: 10, color: "#9ca3af" }}>{hint}</span>}
    </label>
  );
}

// - Shared style tokens -
const CARD = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  padding: "20px 24px 16px",
  boxShadow: "0 12px 34px rgba(15,23,42,.06)",
};

const INP = {
  width: "100%",
  boxSizing: "border-box",
  height: 40,
  border: "1.5px solid #d1d5db",
  borderRadius: 8,
  padding: "0 13px",
  fontSize: 13,
  color: "#0f172a",
  fontFamily: "inherit",
  background: "#fff",
};

// - Main Component -
export default function EditProfile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const editableCardRef = useRef(null);
  const initialRole = normalizeRole(sessionStorage.getItem("role"), "faculty");
  const initialSchool = canonicalSchoolValue(sessionStorage.getItem("school"));
  const initialDepartment = isNonTeachingRole(initialRole)
    ? sessionStorage.getItem("department") || ""
    : canonicalDepartmentValue(sessionStorage.getItem("department"));

  const [formData, setFormData] = useState({
    staffType: isNonTeachingRole(initialRole) ? "non_teaching" : "teaching",
    email: sessionStorage.getItem("username") || "",
    name: sessionStorage.getItem("name") || "",
    employeeId: sessionStorage.getItem("employeeId") || "",
    designation: sessionStorage.getItem("designation") || "",
    qualification: sessionStorage.getItem("qualification") || "",
    experience: sessionStorage.getItem("experience") || "",
    phone: sessionStorage.getItem("phone") || "",
    profilePictureUrl: sessionStorage.getItem("profilePictureUrl") || sessionStorage.getItem("profile_picture_url") || sessionStorage.getItem("avatarUrl") || "",
    school: initialSchool,
    department: initialDepartment,
    role: initialRole,
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [pendingPhotoSrc, setPendingPhotoSrc] = useState("");
  const [photoAdjust, setPhotoAdjust] = useState({ zoom: 1, x: 0, y: 0 });

  const selectedSchool = useMemo(() => canonicalSchoolValue(formData.school), [formData.school]);
  const selectedRole = normalizeRole(formData.role, "");
  const isNonTeaching = formData.staffType === "non_teaching";
  const requiresSchool = !isNonTeaching && selectedRole !== "vc";
  const schoolNeedsDepartment = isSoemrSchool(selectedSchool);
  const isCisr = isCisrSchool(selectedSchool);
  const needsDepartment = !isNonTeaching && schoolNeedsDepartment;
  const roleOptions = BASE_ROLE_OPTIONS.filter((role) => {
    const optionIsNonTeaching = isNonTeachingRole(role.value);
    if (isNonTeaching) return optionIsNonTeaching;
    if (optionIsNonTeaching) return false;
    if (role.value === "hod") return schoolNeedsDepartment;
    if (role.value === "center_head") return isCisr;
    if (isCisr && (role.value === "director" || role.value === "dean")) return false;
    return true;
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => {
      if (name === "school") return { ...prev, school: value, role: "", department: "" };
      if (name === "experience") return { ...prev, experience: filterNumeric(value) };
      if (name === "phone") return { ...prev, phone: filterPhone(value) };
      return { ...prev, [name]: value };
    });
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file for the profile picture.");
      event.target.value = "";
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Profile picture must be 2 MB or smaller.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setError("");
      setPhotoAdjust({ zoom: 1, x: 0, y: 0 });
      setPendingPhotoSrc(String(reader.result || ""));
    };
    reader.onerror = () => {
      setError("Unable to read the selected image. Please try another file.");
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setFormData((prev) => ({ ...prev, profilePictureUrl: "" }));
    setPendingPhotoSrc("");
    setPhotoAdjust({ zoom: 1, x: 0, y: 0 });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const cancelPhotoAdjustment = () => {
    setPendingPhotoSrc("");
    setPhotoAdjust({ zoom: 1, x: 0, y: 0 });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const applyPhotoAdjustment = async () => {
    try {
      const adjustedUrl = await createAdjustedProfileImage(pendingPhotoSrc, photoAdjust);
      setFormData((prev) => ({ ...prev, profilePictureUrl: adjustedUrl }));
      setPendingPhotoSrc("");
      setPhotoAdjust({ zoom: 1, x: 0, y: 0 });
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setError(err?.message || "Unable to adjust the selected image. Please try another file.");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!formData.employeeId.trim()) { setError("Employee ID is required."); return; }
    if (!isValidEmployeeId(formData.employeeId)) { setError("Employee ID must be 2-30 characters and contain only letters, numbers, /, - or _."); return; }
    if (!formData.designation.trim()) { setError("Designation is required."); return; }
    if (formData.experience && !isValidExperience(formData.experience)) { setError("Experience must be a number between 0 and 80."); return; }
    if (formData.phone && !isValidPhone(formData.phone)) { setError("Please enter a valid phone number."); return; }

    setSaving(true);
    try {
      const email = String(formData.email || "").trim().toLowerCase();
      const role = normalizeRole(formData.role, "");
      const nonTeaching = formData.staffType === "non_teaching";
      const school = canonicalSchoolValue(formData.school);
      const department = nonTeaching
        ? String(formData.department || "").trim()
        : isSoemrSchool(school) ? canonicalDepartmentValue(formData.department) : "";

      const cleanFormData = {
        ...formData,
        email,
        name: sanitizeText(formData.name),
        employeeId: sanitizeText(formData.employeeId),
        designation: sanitizeText(formData.designation),
        qualification: sanitizeText(formData.qualification),
        experience: sanitizeText(formData.experience),
        phone: sanitizeText(formData.phone),
        profilePictureUrl: formData.profilePictureUrl,
        role,
        school: nonTeaching ? "" : school,
        department,
      };
      const profilePayload = buildProfilePayload(cleanFormData, APP_INFO.DEFAULT_AY);
      const savedProfile = await updateProfile(profilePayload);
      const sessionProfile = { ...profilePayload, ...(savedProfile || {}) };
      if (!cleanFormData.profilePictureUrl) {
        sessionProfile.profile_picture_url = null;
        sessionProfile.profilePictureUrl = null;
        sessionProfile.avatar_url = null;
        sessionProfile.avatarUrl = null;
        sessionProfile.photo_url = null;
        sessionProfile.photoUrl = null;
        sessionProfile.picture_url = null;
        sessionProfile.pictureUrl = null;
      }
      storeUserSession({ profile: sessionProfile, fallbackEmail: email });
      setMessage("Profile updated successfully.");
      setTimeout(() => navigate("/dashboard", { replace: true }), 450);
    } catch (err) {
      setError(err?.message || "Unable to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const initials = initialsFromName(formData.name);
  const roleLabel = ROLE_LABEL[formData.role] || "User";
  const schoolLabel = isNonTeaching
    ? formData.department || "Department / Office"
    : formData.department || formData.school || "-";
  const experienceLabel = formData.experience ? `${formData.experience} Years` : "-";

  return (
    <div className="ep-page" style={{ height: "100vh", overflowY: "hidden", background: "#f8fafc", fontFamily: "inherit", color: "#0f172a" }}>
      <CssInjector />

      {/* - Sticky white navbar - */}
      <nav style={{ position: "sticky", top: 0, zIndex: 40, background: "#fff", borderBottom: "1px solid #e5e7eb", boxShadow: "0 1px 4px rgba(15,23,42,.06)" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 32px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Brand */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: "linear-gradient(135deg,#6366f1,#2563eb)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: 13, letterSpacing: 0.5, boxShadow: "0 10px 24px rgba(37,99,235,.22)" }}>FA</div>
            <div>
              <div style={{ fontWeight: 900, fontSize: 16, color: "#0f172a", lineHeight: 1.1 }}>{APP_INFO.PORTAL_NAME}</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>{APP_INFO.UNIVERSITY_NAME}</div>
            </div>
          </div>
          {/* Back link */}
          <button
            className="ep-back"
            onClick={() => navigate("/dashboard")}
            style={{ display: "flex", alignItems: "center", gap: 8, border: "none", background: "transparent", color: "#2563eb", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit", padding: "6px 0", transition: "color .15s" }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
            Back to Dashboard
          </button>
        </div>
      </nav>

      {/* - Main content - */}
      <main style={{ maxWidth: 1240, margin: "0 auto", padding: "18px 32px 22px" }}>

        {/* - Profile hero - */}
        <div className="ep-hero" style={{ display: "grid", gridTemplateColumns: "minmax(340px, 1fr) minmax(520px, 1.12fr)", alignItems: "center", gap: 22, marginBottom: 16, position: "relative", overflow: "hidden", background: "#fff", borderRadius: 22, border: "1px solid #e5e7eb", padding: "20px 28px", boxShadow: "0 14px 42px rgba(15,23,42,.06)" }}>
          <div style={{ position: "absolute", right: -44, top: -60, width: 210, height: 210, borderRadius: "50%", background: "linear-gradient(135deg,rgba(99,102,241,.08),rgba(124,58,237,.16))" }} />
          <button
            type="button"
            className="ep-edit-hero"
            onClick={() => editableCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
            style={{ position: "absolute", top: 16, right: 22, height: 38, display: "flex", alignItems: "center", gap: 8, border: "1px solid #bfdbfe", borderRadius: 10, background: "#fff", color: "#2563eb", padding: "0 16px", fontWeight: 800, fontSize: 12, cursor: "pointer", fontFamily: "inherit", zIndex: 2 }}
          >
            <IconGlyph name="edit" size={16} />
            Edit Profile
          </button>

          <div className="ep-hero-left" style={{ display: "flex", alignItems: "center", gap: 20, minWidth: 0, position: "relative", zIndex: 1 }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div style={{ width: 96, height: 96, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#2563eb)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: 32, letterSpacing: 1, boxShadow: "0 12px 28px rgba(37,99,235,.25)", overflow: "hidden", border: "4px solid #fff" }}>
                {formData.profilePictureUrl ? (
                  <img src={formData.profilePictureUrl} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                ) : (
                  initials
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Change profile picture"
                style={{ position: "absolute", bottom: 5, right: 3, width: 28, height: 28, borderRadius: "50%", background: "#22c55e", border: "3px solid #fff", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 5px 14px rgba(34,197,94,.32)" }}
              >
                <IconGlyph name="edit" size={13} />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: "none" }} />
            </div>
            <div style={{ minWidth: 0, paddingRight: 20 }}>
              <h1 style={{ margin: "0 0 10px", fontSize: 25, fontWeight: 900, color: "#0f172a", lineHeight: 1.08, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {formData.name || "Your Profile"}
              </h1>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: "#2563eb", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 20, padding: "4px 12px" }}>
                  {roleLabel}
                </span>
                {formData.school && !isNonTeaching && (
                  <span style={{ fontSize: 12, fontWeight: 800, color: "#15803d", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 20, padding: "4px 12px" }}>
                    {formData.school}
                  </span>
                )}
                {formData.email && <span style={{ fontSize: 12, color: "#64748b" }}>{formData.email}</span>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#64748b", fontSize: 13, fontWeight: 700 }}>
                <SoftIcon name="building" color="#7c3aed" bg="#f3e8ff" size={24} />
                <span>{schoolLabel}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
                <button
                  type="button"
                  className="ep-photo-btn"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ height: 34, padding: "0 14px", borderRadius: 999, border: "1px solid #dbe3ef", background: "#fff", color: "#475569", fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}
                >
                  {formData.profilePictureUrl ? "Change Photo" : "Upload Photo"}
                </button>
                {formData.profilePictureUrl && (
                  <button
                    type="button"
                    onClick={removePhoto}
                    style={{ height: 34, padding: "0 12px", borderRadius: 999, border: "1px solid #fecaca", background: "#fff5f5", color: "#b91c1c", fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    Remove
                  </button>
                )}
                {formData.profilePictureUrl?.startsWith("data:image/") && (
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoAdjust({ zoom: 1, x: 0, y: 0 });
                      setPendingPhotoSrc(formData.profilePictureUrl);
                    }}
                    style={{ height: 34, padding: "0 12px", borderRadius: 999, border: "1px solid #dbe3ef", background: "#f8fafc", color: "#475569", fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    Adjust
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="ep-stat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(100px, 1fr))", alignItems: "stretch", paddingLeft: 6, position: "relative", zIndex: 1 }}>
            <HeroStat icon="id" label="Employee ID" value={formData.employeeId} color="#2563eb" bg="#eef2ff" />
            <HeroStat icon="cap" label="Qualification" value={formData.qualification} color="#4f46e5" bg="#eef2ff" />
            <HeroStat icon="briefcase" label="Experience" value={experienceLabel} color="#2563eb" bg="#eef2ff" />
            <HeroStat icon="shield" label="Account Status" value="Active" color="#16a34a" bg="#dcfce7" />
          </div>
        </div>

        <form onSubmit={handleSubmit}>

          {/* - Alerts - */}
          {error && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, background: "#fff5f5", color: "#991b1b", border: "1px solid #fecaca", borderRadius: 10, padding: "13px 16px", marginBottom: 22, fontSize: 13, lineHeight: 1.5 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              {error}
            </div>
          )}
          {message && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0", borderRadius: 10, padding: "13px 16px", marginBottom: 22, fontSize: 13, lineHeight: 1.5 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><path d="M20 6L9 17l-5-5" /></svg>
              {message}
            </div>
          )}

          <div className="ep-profile-cards" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, alignItems: "stretch" }}>
            {/* - Card 1: Account Information (read-only) - */}
            <div style={{ ...CARD, height: "100%", boxSizing: "border-box" }}>
              <SectionHead title="Account Information" badge="Read-only" badgeColor="#2563eb" badgeBack="#eff6ff" icon="users" iconColor="#2563eb" iconBg="#eff6ff" />
              <div className="ep-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 18 }}>
                <FrozenField label="Staff Type" value={STAFF_TYPE_LABEL[formData.staffType]} />
                <FrozenField label="Role" value={ROLE_LABEL[formData.role] || formData.role} />
                {!isNonTeaching && (
                  <FrozenField label="School" value={formData.school} wide />
                )}
                {(needsDepartment || isNonTeaching) && (
                  <FrozenField
                    label={isNonTeaching ? "Department / Office" : "SoEMR Department"}
                    value={formData.department}
                  />
                )}
                <FrozenField label="Email Address" value={formData.email} />
                <FrozenField label="Full Name" value={formData.name} />
              </div>
            </div>

            {/* - Card 2: Editable Details - */}
            <div ref={editableCardRef} style={{ ...CARD, height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
              <SectionHead
                title="Personal Details"
                badge="Editable"
                badgeColor="#7c3aed"
                badgeBack="#f3e8ff"
                icon="user"
                iconColor="#7c3aed"
                iconBg="#f3e8ff"
              />
              <div className="ep-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 18 }}>
                <InputField label="Employee ID" required hint="e.g. EMP001 - letters, numbers, / - _">
                  <IconInput icon="id">
                    <input
                      name="employeeId"
                      value={formData.employeeId}
                      onChange={handleChange}
                      required
                      maxLength={30}
                      placeholder="EMP001"
                    />
                  </IconInput>
                </InputField>

                <InputField label="Designation" required hint="e.g. Assistant Professor">
                  <IconInput icon="briefcase">
                    <input
                      name="designation"
                      value={formData.designation}
                      onChange={handleChange}
                      required
                      maxLength={100}
                      placeholder="Assistant Professor"
                    />
                  </IconInput>
                </InputField>

                <InputField label="Qualification" hint="e.g. Ph.D, M.Tech">
                  <IconInput icon="cap">
                    <input
                      name="qualification"
                      value={formData.qualification}
                      onChange={handleChange}
                      maxLength={100}
                      placeholder="Ph.D, M.Tech"
                    />
                  </IconInput>
                </InputField>

                <InputField label="Experience (years)" hint="0 to 80 years">
                  <IconInput icon="clock">
                    <input
                      name="experience"
                      value={formData.experience}
                      onChange={handleChange}
                      inputMode="decimal"
                      maxLength={4}
                      placeholder="e.g. 10"
                    />
                  </IconInput>
                </InputField>

                <InputField label="Phone" hint="+91 98765 43210" wide>
                  <IconInput icon="phone">
                    <input
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      inputMode="tel"
                      maxLength={20}
                      placeholder="+91 98765 43210"
                    />
                  </IconInput>
                </InputField>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 10, marginTop: 10, paddingTop: 8, borderTop: "1px solid #eef2f7" }}>
                <button
                  type="button"
                  className="ep-cancel"
                  onClick={() => navigate("/dashboard")}
                  style={{ border: "1.5px solid #e2e8f0", background: "#fff", color: "#475569", borderRadius: 9, padding: "0 18px", height: 38, cursor: "pointer", fontWeight: 700, fontFamily: "inherit", fontSize: 12, transition: "all .15s" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="ep-save"
                  style={{ display: "flex", alignItems: "center", gap: 7, border: "none", background: saving ? "#93c5fd" : "#2563eb", color: "#fff", borderRadius: 9, padding: "0 20px", height: 38, cursor: saving ? "wait" : "pointer", fontWeight: 800, fontFamily: "inherit", fontSize: 12, transition: "all .18s", boxShadow: saving ? "none" : "0 2px 8px rgba(37,99,235,.25)", whiteSpace: "nowrap" }}
                >
                  {saving ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "spin 1s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      Save Profile
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

        </form>

        {/* Spinner keyframe (for save button loading state) */}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </main>
      {pendingPhotoSrc && (
        <PhotoAdjustModal
          src={pendingPhotoSrc}
          adjust={photoAdjust}
          setAdjust={setPhotoAdjust}
          onCancel={cancelPhotoAdjustment}
          onApply={applyPhotoAdjustment}
        />
      )}
    </div>
  );
}

