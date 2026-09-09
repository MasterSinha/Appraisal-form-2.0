import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Bug, CircleHelp, Lightbulb, MessageSquare, Ellipsis, X, Send, CheckCircle2 } from "lucide-react";
import "./ReportBugModal.css";
import { submitFeedback } from "../../services/feedbackService";

const CATEGORY_OPTIONS = [
  ["bug", "Bug", Bug], ["query", "Question", CircleHelp], ["suggestion", "Idea", Lightbulb],
  ["feedback", "Feedback", MessageSquare], ["other", "Other", Ellipsis],
];

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
          <span style={{ width: 27, height: 27, borderRadius: 9, background: "linear-gradient(135deg,#a78bfa,#7c3aed)", display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 10px rgba(124,58,237,0.4)" }}>
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

  const dialogRef = useRef(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { dialog.close(); document.body.style.overflow = overflow; };
  }, []);

  return createPortal(
    <dialog ref={dialogRef} className="feedback-dialog" aria-label="Report a Bug"
      onCancel={() => onClose?.()}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose?.();
      }}>
      <header className="feedback-header">
        <span className="feedback-symbol"><Bug size={24} aria-hidden="true" /></span>
        <div><h2>Report a Bug</h2><p>Sent directly to the admin team</p></div>
        <button type="button" className="feedback-close" onClick={onClose} aria-label="Close" title="Close"><X size={20} /></button>
      </header>
      {done ? (
        <div className="feedback-success">
          <CheckCircle2 size={44} color="#059669" aria-hidden="true" />
          <h3>Report sent</h3>
          <p>Your report has been sent to the admin team. We'll follow up by email if needed.</p>
          <button type="button" className="feedback-submit" onClick={onClose}>Close</button>
        </div>
      ) : (
        <form className="feedback-form" onSubmit={(event) => { event.preventDefault(); if (!submitting) handleSubmit(); }}>
          <fieldset disabled={submitting}>
            <legend>Category</legend>
            <div className="feedback-categories">
              {CATEGORY_OPTIONS.map(([value, label, Glyph]) => (
                <label key={value} className={category === value ? "is-selected" : ""}>
                  <input type="radio" name="feedback-category" value={value} checked={category === value} onChange={() => setCategory(value)} />
                  <Glyph size={18} aria-hidden="true" /><span>{label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <label className="feedback-field">Subject
            <input type="text" value={subject} onChange={(event) => setSubject(event.target.value)} maxLength={120} placeholder="Short summary" disabled={submitting} />
          </label>
          <label className="feedback-field">Message
            <textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength={5000} rows={6} placeholder="What happened? Steps to reproduce, if it's a bug." disabled={submitting} />
          </label>
          {error && <div role="alert" className="feedback-error">{error}</div>}
          <footer className="feedback-footer"><span>{message.length} / 5000</span>
            <button type="submit" className="feedback-submit" disabled={submitting}><Send size={16} aria-hidden="true" />{submitting ? "Sending..." : "Send Report"}</button>
          </footer>
        </form>
      )}
    </dialog>, document.body
  );
}
