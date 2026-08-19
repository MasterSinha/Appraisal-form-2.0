import { useState } from "react";
import { submitFeedback } from "../../services/feedbackService";

const ICON_PROPS = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };

const CATEGORY_OPTIONS = [
  ["bug", "Bug", <svg key="bug" {...ICON_PROPS}><rect x="8" y="6" width="8" height="12" rx="4" /><path d="M8 10H4M8 14H4M16 10h4M16 14h4M12 6V3M9.5 5l-1-2M14.5 5l1-2" /></svg>],
  ["query", "Question", <svg key="query" {...ICON_PROPS}><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.5-2 2-2 3.5" /><path d="M12 17h.01" /></svg>],
  ["suggestion", "Idea", <svg key="suggestion" {...ICON_PROPS}><path d="M9 18h6" /><path d="M10 22h4" /><path d="M12 2a6 6 0 0 0-4 10.5c.6.6 1 1.4 1 2.5h6c0-1.1.4-1.9 1-2.5A6 6 0 0 0 12 2Z" /></svg>],
  ["feedback", "Feedback", <svg key="feedback" {...ICON_PROPS}><path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-4-1L3 20l1-4.5a8.38 8.38 0 0 1-1-4A8.5 8.5 0 0 1 11.5 3 8.38 8.38 0 0 1 21 11.5Z" /></svg>],
  ["other", "Other", <svg key="other" {...ICON_PROPS}><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></svg>],
];

const inputBaseStyle = { width: "100%", background: "rgba(255,255,255,0.04)", color: "#f1f5f9", border: "1.5px solid rgba(255,255,255,0.10)", borderRadius: 11, padding: "10px 12px", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box", transition: "border-color .15s, box-shadow .15s", outline: "none" };
const inputFocusStyle = { borderColor: "#818cf8", boxShadow: "0 0 0 3px rgba(129,140,248,0.18)" };

function FocusField({ as = "input", style, ...props }) {
  const [focused, setFocused] = useState(false);
  const Tag = as;
  return (
    <Tag
      {...props}
      className="fa-dark-field"
      onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
      onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
      style={{ ...inputBaseStyle, ...(focused ? inputFocusStyle : {}), ...style }}
    />
  );
}

export function ReportBugButton({ style, iconOnly = false }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Report a bug or send feedback"
        style={style || { minHeight: 34, borderRadius: 12, padding: "6px 8px", color: "#c7d2fe", background: "rgba(99,102,241,0.10)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, width: "100%", fontFamily: "inherit" }}
      >
        {iconOnly ? (
          <span style={{ width: 27, height: 27, borderRadius: 9, background: "linear-gradient(135deg,#fb7185,#e11d48)", display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 10px rgba(225,29,72,0.4)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="8" y="6" width="8" height="12" rx="4" /><path d="M8 10H4M8 14H4M16 10h4M16 14h4M12 6V3M9.5 5l-1-2M14.5 5l1-2" />
            </svg>
          </span>
        ) : (
          <>
            <span style={{ width: 24, height: 24, borderRadius: 9, background: "rgba(99,102,241,0.18)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="8" y="6" width="8" height="12" rx="4" /><path d="M8 10H4M8 14H4M16 10h4M16 14h4M12 6V3M9.5 5l-1-2M14.5 5l1-2" />
              </svg>
            </span>
            <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 800, fontSize: 11 }}>Report a Bug</span>
          </>
        )}
      </button>
      {open && <ReportBugModal onClose={() => setOpen(false)} />}
    </>
  );
}

export default function ReportBugModal({ onClose }) {
  const [category, setCategory] = useState("bug");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const email = sessionStorage.getItem("email") || sessionStorage.getItem("username") || "";
  const name = sessionStorage.getItem("name") || "";

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      setError("Please fill in both subject and message.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await submitFeedback({ name, email, category, subject, message });
      setDone(true);
    } catch (err) {
      setError(err.message || "Could not submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", backdropFilter: "blur(2px)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div className="fa-fade-up" style={{ background: "#141d33", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20, padding: "22px 22px 24px", width: "100%", maxWidth: 420, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 30px 70px rgba(2,6,23,0.55)" }}>
        {done ? (
          <div style={{ textAlign: "center", padding: "12px 4px" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg,#34d399,#059669)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16, boxShadow: "0 10px 24px rgba(5,150,105,0.35)" }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
            </div>
            <div style={{ fontSize: 16, fontWeight: 900, color: "#f8fafc", marginBottom: 6 }}>Thanks — got it.</div>
            <div style={{ fontSize: 13, color: "#a8b2c4", lineHeight: 1.5, marginBottom: 22 }}>
              Your report has been sent to the admin team. We'll follow up by email if needed.
            </div>
            <button type="button" onClick={onClose} style={{ width: "100%", padding: "11px 16px", background: "linear-gradient(135deg,#818cf8,#4338ca)", color: "#fff", border: "none", borderRadius: 12, fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 8px 18px rgba(79,70,229,0.32)" }}>
              Close
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
                <span style={{ width: 38, height: 38, borderRadius: 12, background: "linear-gradient(135deg,#fb7185,#e11d48)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 8px 18px rgba(225,29,72,0.35)" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="6" width="8" height="12" rx="4" /><path d="M8 10H4M8 14H4M16 10h4M16 14h4M12 6V3M9.5 5l-1-2M14.5 5l1-2" /></svg>
                </span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 15.5, fontWeight: 900, color: "#f8fafc", letterSpacing: -0.2 }}>Report a Bug</div>
                  <div style={{ fontSize: 11.5, color: "#8b96a8", marginTop: 2 }}>Sent directly to the admin team</div>
                </div>
              </div>
              <button type="button" onClick={onClose} aria-label="Close" style={{ width: 28, height: 28, background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 9, cursor: "pointer", color: "#8b96a8", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="M6 6l12 12" /></svg>
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: "#a8b2c4", display: "block", marginBottom: 7 }}>Category</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 7 }}>
                  {CATEGORY_OPTIONS.map(([value, label, icon]) => {
                    const active = category === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setCategory(value)}
                        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, padding: "9px 4px", borderRadius: 12, border: active ? "1.5px solid #818cf8" : "1.5px solid rgba(255,255,255,0.10)", background: active ? "rgba(129,140,248,0.16)" : "rgba(255,255,255,0.03)", color: active ? "#c7d2fe" : "#8b96a8", cursor: "pointer", fontFamily: "inherit", transition: "border-color .15s, background .15s" }}
                      >
                        {icon}
                        <span style={{ fontSize: 10, fontWeight: active ? 800 : 700 }}>{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: "#a8b2c4", display: "block", marginBottom: 6 }}>Subject</label>
                <FocusField
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  maxLength={120}
                  placeholder="Short summary"
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: "#a8b2c4", display: "block", marginBottom: 6 }}>Message</label>
                <FocusField
                  as="textarea"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={5000}
                  rows={4}
                  placeholder="What happened? Steps to reproduce, if it's a bug."
                  style={{ resize: "vertical", lineHeight: 1.5 }}
                />
              </div>

              {error && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(248,113,113,0.10)", border: "1px solid rgba(248,113,113,0.28)", color: "#fca5a5", padding: "9px 12px", borderRadius: 10, fontSize: 12 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="9" /><path d="M12 8v5" /><path d="M12 16h.01" /></svg>
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "12px 16px", background: submitting ? "#475569" : "linear-gradient(135deg,#fb7185,#e11d48)", color: "#fff", border: "none", borderRadius: 12, fontWeight: 800, fontSize: 13.5, cursor: submitting ? "wait" : "pointer", fontFamily: "inherit", boxShadow: submitting ? "none" : "0 10px 22px rgba(225,29,72,0.32)", transition: "transform .15s, box-shadow .15s" }}
              >
                {submitting ? "Sending..." : (
                  <>
                    Send Report
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
