import { useAnnouncements } from "../../hooks/useAnnouncements";

export default function NoticesBanner() {
  const { visible, dismiss, error } = useAnnouncements();

  if (error || visible.length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
      {visible.map((a) => (
        <div
          key={a.id}
          className="fa-fade-up"
          style={{ display: "flex", alignItems: "flex-start", gap: 13, background: "#fffdf7", border: "1px solid #fde68a", borderRadius: 14, padding: "13px 14px", boxShadow: "0 4px 14px rgba(180,83,9,0.07)" }}
        >
          <span style={{ width: 34, height: 34, borderRadius: 11, background: "linear-gradient(135deg,#fbbf24,#f59e0b)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 6px 14px rgba(245,158,11,0.35)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 8a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
              <path d="M10 20a2 2 0 0 0 4 0" />
            </svg>
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 900, fontSize: 13, color: "#78350f", letterSpacing: -0.1 }}>{a.title}</div>
            <div style={{ marginTop: 3, fontSize: 12.5, color: "#92400e", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{a.body}</div>
            {a.createdBy && (
              <div style={{ marginTop: 4, fontSize: 10.5, color: "#b45309" }}>From: {a.createdBy}</div>
            )}
          </div>
          <button
            type="button"
            onClick={() => dismiss(a.id)}
            aria-label="Dismiss notice"
            style={{ width: 26, height: 26, borderRadius: 9, background: "rgba(245,158,11,0.12)", border: "none", cursor: "pointer", color: "#b45309", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" /><path d="M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
