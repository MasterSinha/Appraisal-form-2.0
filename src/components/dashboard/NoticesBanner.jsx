import { useState } from "react";
import { useAnnouncements } from "../../hooks/useAnnouncements";

const PREVIEW_LENGTH = 120;

function NoticeCard({ notice, onDismiss }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = notice.body.length > PREVIEW_LENGTH;
  const previewBody = isLong && !expanded ? `${notice.body.slice(0, PREVIEW_LENGTH).trimEnd()}…` : notice.body;

  return (
    <div
      className="fa-fade-up"
      style={{ display: "flex", alignItems: "flex-start", gap: 12, background: "#fffdf7", border: "1px solid #fde68a", borderRadius: 12, padding: "10px 12px", boxShadow: "0 4px 14px rgba(180,83,9,0.07)" }}
    >
      <span style={{ width: 26, height: 26, borderRadius: 9, background: "linear-gradient(135deg,#fbbf24,#f59e0b)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 10px rgba(245,158,11,0.3)" }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
          <path d="M10 20a2 2 0 0 0 4 0" />
        </svg>
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 900, fontSize: 12.5, color: "#78350f", letterSpacing: -0.1 }}>{notice.title}</span>
          {notice.createdBy && <span style={{ fontSize: 10, color: "#b45309" }}>· {notice.createdBy}</span>}
        </div>
        <div style={{ marginTop: 3, fontSize: 12, color: "#92400e", lineHeight: 1.5, whiteSpace: expanded ? "pre-wrap" : "normal" }}>
          {previewBody}
          {isLong && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              style={{ marginLeft: 6, background: "none", border: "none", padding: 0, cursor: "pointer", color: "#b45309", fontWeight: 800, fontSize: 12, textDecoration: "underline" }}
            >
              {expanded ? "Show less" : "Read more"}
            </button>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notice"
        style={{ width: 22, height: 22, borderRadius: 8, background: "rgba(245,158,11,0.12)", border: "none", cursor: "pointer", color: "#b45309", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6 6 18" /><path d="M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export default function NoticesBanner() {
  const { visible, dismiss, error } = useAnnouncements();

  if (error || visible.length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
      {visible.map((a) => (
        <NoticeCard key={a.id} notice={a} onDismiss={() => dismiss(a.id)} />
      ))}
    </div>
  );
}
