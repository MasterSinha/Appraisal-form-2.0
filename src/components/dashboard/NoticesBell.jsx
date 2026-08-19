import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAnnouncements } from "../../hooks/useAnnouncements";

const relativeTime = (iso) => {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const diffMin = Math.round((Date.now() - then) / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
};

// Persistent access point for Important Notices, living in the sidebar footer next to Report a
// Bug - shows every active notice targeting this user (dismissed-from-the-banner or not), so a
// notice closed on NoticesBanner is still reachable here at any time.
export default function NoticesBell({ style }) {
  const { all, dismissed, dismiss } = useAnnouncements();
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState(null);
  const triggerRef = useRef(null);
  const unreadCount = all.filter((a) => !dismissed.has(a.id)).length;

  useEffect(() => {
    if (!open) return undefined;
    const updateRect = () => {
      const r = triggerRef.current?.getBoundingClientRect();
      if (r) setRect(r);
    };
    updateRect();
    window.addEventListener("resize", updateRect);
    return () => window.removeEventListener("resize", updateRect);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const handleClickOutside = (event) => {
      if (triggerRef.current?.contains(event.target)) return;
      if (event.target.closest?.('[data-notices-panel="true"]')) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Important Notices"
        style={{ position: "relative", ...(style || { flex: 1, height: 40, borderRadius: 13, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }) }}
      >
        <span style={{ width: 27, height: 27, borderRadius: 9, background: "linear-gradient(135deg,#818cf8,#4f46e5)", display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 10px rgba(79,70,229,0.4)" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="#fff">
            <path d="M12 2.5c-2.76 0-5 2.24-5 5v2.87c0 .66-.28 1.29-.76 1.75L4.6 13.6a1.15 1.15 0 0 0 .8 1.97h13.2a1.15 1.15 0 0 0 .8-1.97l-1.64-1.48a2.37 2.37 0 0 1-.76-1.75V7.5c0-2.76-2.24-5-5-5Z" />
            <path d="M9.3 18a2.7 2.7 0 0 0 5.4 0" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
        {unreadCount > 0 && (
          <span style={{ position: "absolute", top: 5, right: 9, minWidth: 15, height: 15, padding: "0 3px", borderRadius: 999, background: "#f59e0b", border: "2px solid #0b1120", color: "#0b1120", fontSize: 9, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {unreadCount}
          </span>
        )}
      </button>

      {open && rect && createPortal(
        <div
          data-notices-panel="true"
          role="dialog"
          aria-label="Important Notices"
          className="fa-fade-up"
          style={{ position: "fixed", zIndex: 2500, left: rect.left, bottom: window.innerHeight - rect.top + 10, width: 336, maxHeight: "62vh", display: "flex", flexDirection: "column", background: "#141d33", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 18, boxShadow: "0 24px 50px rgba(2,6,23,0.55)", overflow: "hidden" }}
        >
          <div style={{ padding: "13px 14px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 10, background: "linear-gradient(180deg,rgba(99,102,241,0.10),transparent)" }}>
            <span style={{ width: 32, height: 32, borderRadius: 11, background: "linear-gradient(135deg,#818cf8,#4338ca)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 6px 14px rgba(79,70,229,0.4)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
                <path d="M12 2.5c-2.76 0-5 2.24-5 5v2.87c0 .66-.28 1.29-.76 1.75L4.6 13.6a1.15 1.15 0 0 0 .8 1.97h13.2a1.15 1.15 0 0 0 .8-1.97l-1.64-1.48a2.37 2.37 0 0 1-.76-1.75V7.5c0-2.76-2.24-5-5-5Z" />
                <path d="M9.3 18a2.7 2.7 0 0 0 5.4 0" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 900, color: "#f8fafc" }}>Important Notices</div>
              <div style={{ fontSize: 10, color: "#8b96a8", marginTop: 1 }}>{unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}</div>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close" style={{ width: 24, height: 24, background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 8, cursor: "pointer", color: "#8b96a8", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="M6 6l12 12" /></svg>
            </button>
          </div>

          {all.length === 0 ? (
            <div style={{ padding: "34px 14px", textAlign: "center" }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.05)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12, color: "#4b5568" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.5c-2.76 0-5 2.24-5 5v2.87c0 .66-.28 1.29-.76 1.75L4.6 13.6a1.15 1.15 0 0 0 .8 1.97h13.2a1.15 1.15 0 0 0 .8-1.97l-1.64-1.48a2.37 2.37 0 0 1-.76-1.75V7.5c0-2.76-2.24-5-5-5Z" />
                </svg>
              </div>
              <div style={{ fontSize: 12.5, color: "#a8b2c4", fontWeight: 700 }}>You're all caught up</div>
              <div style={{ fontSize: 11, color: "#7c8698", marginTop: 3 }}>No notices right now.</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", overflowY: "auto" }}>
              {all.map((a) => {
                const unread = !dismissed.has(a.id);
                return (
                  <div key={a.id} style={{ display: "flex", gap: 10, padding: "13px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: unread ? "rgba(99,102,241,0.07)" : "transparent" }}>
                    <span style={{ width: 26, height: 26, borderRadius: 8, flexShrink: 0, marginTop: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", background: unread ? "linear-gradient(135deg,#818cf8,#4338ca)" : "rgba(255,255,255,0.06)", boxShadow: unread ? "0 4px 10px rgba(79,70,229,0.35)" : "none" }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill={unread ? "#fff" : "#6b7686"}>
                        <path d="M3 10.5v3a1 1 0 0 0 1 1h1.2l5.3 3.9a.6.6 0 0 0 .95-.48V6.08a.6.6 0 0 0-.95-.48L5.2 9.5H4a1 1 0 0 0-1 1Z" />
                        <path d="M14.5 8a4.5 4.5 0 0 1 0 8" stroke={unread ? "#fff" : "#6b7686"} strokeWidth="1.8" fill="none" strokeLinecap="round" />
                        <path d="M14.5 4.5a8 8 0 0 1 0 15" stroke={unread ? "#fff" : "#6b7686"} strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.55" />
                      </svg>
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 800, color: "#f1f5f9" }}>{a.title}</span>
                        <span style={{ fontSize: 9.5, color: "#7c8698", flexShrink: 0, whiteSpace: "nowrap", marginTop: 2 }}>{relativeTime(a.createdAt)}</span>
                      </div>
                      <div style={{ marginTop: 4, fontSize: 11.5, color: "#a8b2c4", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{a.body}</div>
                      {a.createdBy && (
                        <div style={{ marginTop: 5, fontSize: 10, color: "#7c8698" }}>From: {a.createdBy}</div>
                      )}
                      {unread && (
                        <button
                          type="button"
                          onClick={() => dismiss(a.id)}
                          style={{ marginTop: 9, display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(129,140,248,0.16)", border: "none", borderRadius: 7, cursor: "pointer", color: "#c7d2fe", fontSize: 10, fontWeight: 800, padding: "5px 10px", fontFamily: "inherit" }}
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  );
}
