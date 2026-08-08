import { useState } from "react";

// Formal "official record" palette - light card on slate/purple/gold accents,
// matching the rest of the VC dashboard's light theme (white cards, slate text,
// the same purple used for the VC role throughout this dashboard).
const T = {
  card: "#ffffff",
  surface: "#f8fafc",
  surfaceSoft: "rgba(15,23,42,0.03)",
  border: "#e2e8f0",
  borderStrong: "#cbd5e1",
  text: "#0f172a",
  textMuted: "#64748b",
  textFaint: "#94a3b8",
  accent: "#7c3aed",
  accentSoft: "#6d28d9",
  accentBg: "rgba(124,58,237,0.07)",
  gold: "#d97706",
};

const oneDecimal = (value) => (Math.trunc((Number(value) || 0) * 10) / 10).toFixed(1);

function RecordIcon({ name, size = 18, color = T.textMuted }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" };
  if (name === "shield") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7.3 15.8 8.9v3.2c0 2.5-1.6 4.4-3.8 5.1-2.2-.7-3.8-2.6-3.8-5.1V8.9L12 7.3Z" />
      </svg>
    );
  }
  if (name === "user") {
    return (
      <svg {...common}>
        <path d="M19 21a7 7 0 0 0-14 0" />
        <circle cx="12" cy="8" r="4" />
      </svg>
    );
  }
  if (name === "briefcase") {
    return (
      <svg {...common}>
        <rect x="3" y="7.5" width="18" height="12" rx="2" />
        <path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5" />
        <path d="M3 12.5h18" />
      </svg>
    );
  }
  if (name === "chart") {
    return (
      <svg {...common}>
        <path d="M4 20V12" />
        <path d="M10 20V6" />
        <path d="M16 20v-8" />
        <path d="M4 20h16" />
      </svg>
    );
  }
  if (name === "crown") {
    return (
      <svg {...common}>
        <path d="m3 8 4 3 5-6 5 6 4-3-1.5 9h-15L3 8Z" />
        <path d="M6 20h12" />
      </svg>
    );
  }
  return null;
}

function NoteModal({ label, content, onClose }) {
  const text = String(content ?? "").trim();
  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ background: T.card, border: `1px solid ${T.borderStrong}`, borderRadius: 14, padding: "18px 20px", maxWidth: 420, width: "100%", boxShadow: "0 24px 60px rgba(2,6,23,0.35)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 10 }}>
          <div style={{ fontWeight: 800, fontSize: 13, color: T.text }}>{label} remarks</div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{ width: 24, height: 24, borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.textMuted, cursor: "pointer", fontSize: 15, lineHeight: 1, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
          >
            &times;
          </button>
        </div>
        <div style={{ color: T.text, fontSize: 12.5, lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: "50vh", overflowY: "auto" }}>
          {text ? `“${text}”` : <span style={{ color: T.textFaint }}>No remarks provided.</span>}
        </div>
      </div>
    </div>
  );
}

// --- 1. Header -----------------------------------------------------------
export function FacultyRecordHeader({ title, subtitle, referenceLabel = "Reference", referenceNumber }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <span style={{ width: 42, height: 42, borderRadius: "50%", border: `1.5px solid ${T.borderStrong}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <RecordIcon name="shield" size={20} color={T.accentSoft} />
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: T.text, fontWeight: 800, fontSize: 17, letterSpacing: 0.1 }}>{title}</div>
            <div style={{ color: T.textMuted, fontSize: 11.5, marginTop: 3 }}>{subtitle}</div>
          </div>
        </div>
        {referenceNumber ? (
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ color: T.textFaint, fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6 }}>{referenceLabel}</div>
            <div style={{ color: T.text, fontSize: 13, fontWeight: 800, fontFamily: "monospace", marginTop: 2 }}>{referenceNumber}</div>
          </div>
        ) : null}
      </div>
      <div style={{ height: 2, marginTop: 16, borderRadius: 2, background: `linear-gradient(90deg, transparent, ${T.accent} 18%, ${T.gold} 50%, ${T.accent} 82%, transparent)`, opacity: 0.75 }} />
    </div>
  );
}

// --- 2. Score table --------------------------------------------------------
// A row's `note` field (when present, even if empty) marks it as having
// remarks a viewer can open in a popup - the row shows an info icon that
// opens NoteModal via onShowNote. Rows without a `note` field (e.g. the
// currently-acting reviewer's own row, or a computed "Average" row) get none.
export function ReviewerScoreRow({ row, columns, onShowNote }) {
  const accent = row.accent ? T.accentSoft : T.text;
  return (
    <tr>
      <td style={{ padding: "10px 6px", borderTop: `1px solid ${T.border}`, whiteSpace: "nowrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <RecordIcon name={row.icon} size={15} color={row.accent ? T.accentSoft : T.textMuted} />
          <span style={{ color: accent, fontWeight: row.accent ? 800 : 600, fontSize: 12.5 }}>{row.label}</span>
        </div>
      </td>
      <td style={{ padding: "10px 6px", borderTop: `1px solid ${T.border}`, textAlign: "center" }}>
        {row.note !== undefined && (
          <button
            type="button"
            onClick={onShowNote}
            aria-label={`View ${row.label} remarks`}
            title={`View ${row.label} remarks`}
            style={{ width: 18, height: 18, borderRadius: "50%", border: "1.5px solid #dc2626", background: "#fef2f2", padding: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#dc2626", fontWeight: 900, fontSize: 11, fontFamily: "inherit", lineHeight: 1 }}
          >
            R
          </button>
        )}
      </td>
      {columns.map((col) => (
        <td key={col.key} style={{ padding: "10px 6px", borderTop: `1px solid ${T.border}`, textAlign: "right" }}>
          <span style={{ color: col.key === "total" ? accent : T.text, fontWeight: col.key === "total" || row.accent ? 800 : 600, fontSize: 12.5 }}>
            {oneDecimal(row.values?.[col.key])}
          </span>
        </td>
      ))}
    </tr>
  );
}

export function ScoreTable({ columns, rows }) {
  const [activeNoteKey, setActiveNoteKey] = useState(null);
  const activeRow = rows.find((row) => row.key === activeNoteKey);
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", minWidth: 480, borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ padding: "0 6px 8px", textAlign: "left", color: T.textFaint, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>Reviewer</th>
            <th style={{ padding: "0 6px 8px", textAlign: "center", color: T.textFaint, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, whiteSpace: "nowrap" }}>Remarks</th>
            {columns.map((col) => (
              <th key={col.key} style={{ padding: "0 6px 8px", textAlign: "right", color: T.textFaint, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, whiteSpace: "nowrap" }}>
                {col.label}{col.max !== undefined ? ` · ${col.max}` : ""}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <ReviewerScoreRow key={row.key} row={row} columns={columns} onShowNote={() => setActiveNoteKey(row.key)} />
          ))}
        </tbody>
      </table>
      {activeRow && (
        <NoteModal label={activeRow.label} content={activeRow.note} onClose={() => setActiveNoteKey(null)} />
      )}
    </div>
  );
}

// --- 4. Final remarks (VC / Dean / any final-authority reviewer) -----------
export function VCFinalRemarks({ value, onChange, readOnly = false, description, title = "Vice Chancellor final remarks", icon = "crown" }) {
  return (
    <div style={{ background: `linear-gradient(180deg, ${T.accentBg}, transparent)`, border: "1px solid #ddd6fe", borderRadius: 12, padding: "14px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <RecordIcon name={icon} size={16} color={T.accentSoft} />
        <span style={{ color: T.accentSoft, fontWeight: 800, fontSize: 13 }}>{title}</span>
      </div>
      {description ? (
        <div style={{ color: T.textMuted, fontSize: 11, marginTop: 5, lineHeight: 1.5 }}>{description}</div>
      ) : null}
      <textarea
        value={value ?? ""}
        readOnly={readOnly}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder="Write the Vice Chancellor's final remarks here..."
        rows={4}
        style={{ width: "100%", boxSizing: "border-box", marginTop: 10, minHeight: 96, resize: "vertical", background: readOnly ? T.surface : "#ffffff", border: "1px solid #c4b5fd", borderRadius: 9, padding: "10px 12px", fontFamily: "inherit", fontSize: 12.5, color: T.text, outline: "none", lineHeight: 1.5 }}
      />
    </div>
  );
}

// --- 5. Final submit button -----------------------------------------------
export function FinalSubmitButton({ children, onClick, disabled = false }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: "100%",
        height: 48,
        border: "none",
        borderRadius: 10,
        cursor: disabled ? "not-allowed" : "pointer",
        background: disabled ? "#cbd5e1" : hover ? "#6d28d9" : T.accent,
        color: "#fff",
        fontWeight: 700,
        fontSize: 13.5,
        fontFamily: "inherit",
        letterSpacing: 0.2,
        transition: "background 150ms ease",
      }}
    >
      {children}
    </button>
  );
}

export { T as FACULTY_RECORD_THEME };
