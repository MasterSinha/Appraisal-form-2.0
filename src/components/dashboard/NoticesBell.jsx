import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Bell, Megaphone, UserRound, Check, X } from "lucide-react";
import { useAnnouncements } from "../../hooks/useAnnouncements";
import "./NoticesBell.css";

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


export default function NoticesBell({ style }) {
  const { all, dismissed, dismiss } = useAnnouncements();
  const [open, setOpen] = useState(false);
  const dialogRef = useRef(null);
  const unreadCount = all.filter((notice) => !dismissed.has(notice.id)).length;

  useEffect(() => {
    if (!open) return undefined;
    const dialog = dialogRef.current;
    dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} title="Important Notices"
        aria-label={`Important Notices, ${unreadCount} unread`} aria-haspopup="dialog"
        style={{ position: "relative", ...(style || { height: 40, flex: 1, cursor: "pointer" }) }}>
        <span className="notices-trigger-icon"><Bell size={17} aria-hidden="true" /></span>
        {unreadCount > 0 && <span className="notices-count">{unreadCount}</span>}
      </button>
      {open && createPortal(
        <dialog ref={dialogRef} className="notices-dialog" aria-labelledby="notices-heading"
          onCancel={() => setOpen(false)} onClose={() => setOpen(false)}
          onClick={(event) => {
            if (event.target !== event.currentTarget) return;
            const rect = event.currentTarget.getBoundingClientRect();
            if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) setOpen(false);
          }}>
          <div className="notices-dialog__layout">
            <header className="notices-dialog__header">
              <span className="notices-dialog__symbol"><Megaphone size={24} aria-hidden="true" /></span>
              <div>
                <h2 id="notices-heading">Announcements</h2>
                <p>{unreadCount > 0 ? `${unreadCount} unread notices` : "All caught up"}</p>
              </div>
              <button type="button" className="notices-close" aria-label="Close announcements" title="Close" onClick={() => setOpen(false)}><X size={20} /></button>
            </header>
            <div className="notices-dialog__body">
              {all.length === 0 ? (
                <div className="notices-empty">
                  <span><Bell size={30} aria-hidden="true" /></span>
                  <h3>You're all caught up</h3>
                  <p>No announcements right now.</p>
                </div>
              ) : all.map((notice) => {
                const unread = !dismissed.has(notice.id);
                return (
                  <article className={`notice-entry${unread ? " notice-entry--unread" : ""}`} key={notice.id}>
                    <span className="notice-entry__icon" aria-hidden="true"><UserRound size={19} /></span>
                    <div className="notice-entry__content">
                      <div className="notice-entry__heading">
                        <h3>{notice.title}</h3>
                        <time dateTime={notice.createdAt}>{relativeTime(notice.createdAt)}</time>
                      </div>
                      <p className="notice-entry__body">{notice.body}</p>
                      <div className="notice-entry__footer">
                        {notice.createdBy && <span>From: {notice.createdBy}</span>}
                        {unread ? <button type="button" onClick={() => dismiss(notice.id)}><Check size={15} aria-hidden="true" />Mark as read</button> : <span className="notice-read"><Check size={14} aria-hidden="true" />Read</span>}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
            <footer className="notices-dialog__footer">{all.length} {all.length === 1 ? "announcement" : "announcements"}</footer>
          </div>
        </dialog>,
        document.body
      )}
    </>
  );
}
