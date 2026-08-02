const percent = (score, max) => Math.min(100, Math.round(((parseFloat(score) || 0) / (parseFloat(max) || 1)) * 100)) || 0;

export function Avatar({ initials, src, alt = "Profile picture", color = "#6366f1", size = 40 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: `linear-gradient(135deg,${color},${color}99)`, color: "#fff", fontWeight: 800, fontSize: size * 0.32, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, letterSpacing: 0.5, overflow: "hidden" }}>
      {src ? (
        <img src={src} alt={alt} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      ) : (
        initials
      )}
    </div>
  );
}

export function ScoreBar({ score, max, color = "#6366f1" }) {
  return (
    <div style={{ width: "100%", background: "#f1f5f9", borderRadius: 4, height: 5, overflow: "hidden" }}>
      <div style={{ width: `${percent(score, max)}%`, height: "100%", background: color, borderRadius: 4, transition: "width .5s" }} />
    </div>
  );
}

const uploadedDocCount = (docs = {}) => {
  if (Array.isArray(docs)) return docs.length;
  if (typeof docs === "number") return docs;
  if (!docs || typeof docs !== "object") return 0;
  if (docs.url || docs.file_url || docs.fileUrl || docs.document_url || docs.documentUrl) return 1;
  const countKeys = new Set([
    "doc_count",
    "docCount",
    "docs_count",
    "docsCount",
    "document_count",
    "documentCount",
    "documents_count",
    "documentsCount",
    "uploaded_docs_count",
    "uploadedDocsCount",
    "supporting_documents_count",
    "supportingDocumentsCount",
  ]);
  const explicitCount =
    docs.doc_count ??
    docs.docCount ??
    docs.docs_count ??
    docs.docsCount ??
    docs.document_count ??
    docs.documentCount ??
    docs.documents_count ??
    docs.documentsCount ??
    docs.uploaded_docs_count ??
    docs.uploadedDocsCount ??
    docs.supporting_documents_count ??
    docs.supportingDocumentsCount;
  if (explicitCount !== undefined && explicitCount !== null && explicitCount !== "" && (parseFloat(explicitCount) || 0) > 0) {
    return parseFloat(explicitCount) || 0;
  }
  return Object.entries(docs).reduce((total, [key, value]) => {
    if (countKeys.has(key)) return total;
    if (Array.isArray(value)) return total + value.length;
    return total + (value ? 1 : 0);
  }, 0);
};

const metricText = (value) => {
  const score = parseFloat(value) || 0;
  return Number.isFinite(score) ? score.toFixed(1) : "0.0";
};

export function ReviewMetricsStrip({
  metrics = [],
  docs,
  includeDocs = true,
  columns,
  background = "#f8fafc",
  style = {},
  compact = false,
}) {
  const docCount = uploadedDocCount(docs);
  const allMetrics = [
    ...metrics,
    ...(includeDocs ? [{ label: "Docs", val: docCount, color: "#10b981", helper: "files uploaded" }] : []),
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: columns || "repeat(auto-fit, minmax(92px, 1fr))",
        gap: compact ? 8 : 10,
        background,
        borderRadius: 8,
        padding: compact ? "10px 12px" : "12px 14px",
        ...style,
      }}
    >
      {allMetrics.map(({ label, val, max, color = "#6366f1", helper }) => {
        const hasMax = max !== undefined && max !== null;
        return (
          <div key={label} style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
            <div style={{ fontSize: compact ? 8 : 9, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</div>
            <div style={{ fontSize: compact ? 13 : 15, fontWeight: 900, color, lineHeight: 1, whiteSpace: "nowrap" }}>
              {hasMax ? metricText(val) : parseFloat(val) || 0}
              {hasMax && <span style={{ fontSize: compact ? 8 : 9, color: "#94a3b8", fontWeight: 700 }}>/{max}</span>}
            </div>
            {hasMax ? <ScoreBar score={val} max={max} color={color} /> : <div style={{ fontSize: 9, color: "#94a3b8" }}>{helper || "files uploaded"}</div>}
          </div>
        );
      })}
    </div>
  );
}

const PART_COLORS = {
  partA: "#6d5dfc",
  partB: "#0f9f9a",
  partC: "#ef6f61",
  partD: "#f59e0b",
};

const scoreValue = (value) => (parseFloat(value) || 0).toFixed(1);

export function ScoreCard({
  title,
  subtitle = "",
  totals = {},
  maxScores = {},
  remarksTitle,
  remarksContent,
  extraContent,
  sideContent,
  partsLayout = "vertical",
  cardStyle = {},
  isFinal = false,
  compact = false,
  accent = "#0ea5e9",
}) {
  const parts = [
    ["partA", "Part A"],
    ["partB", "Part B"],
    ...(maxScores.partC !== undefined ? [["partC", "Part C"]] : []),
    ...(maxScores.partD !== undefined ? [["partD", "Part D"]] : []),
  ];
  const totalMax = maxScores.grand ?? maxScores.total ?? 0;
  const hasRemarks = remarksContent !== undefined && remarksContent !== null;
  const horizontalParts = partsLayout === "horizontal";
  const rowPadding = compact ? "7px 10px" : "8px 12px";
  const rowMargin = compact ? 4 : 5;
  const barHeight = compact ? 4 : 5;
  const marksPanel = (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: compact ? 8 : 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <span style={{ width: compact ? 32 : 36, height: compact ? 32 : 36, borderRadius: 9, background: `${accent}16`, border: `1px solid ${accent}30`, color: accent, display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 900, flexShrink: 0 }}>{title.slice(0, 1)}</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: compact ? 13 : 14, fontWeight: 900, color: "#0f172a" }}>{title}</div>
            {subtitle && <div style={{ fontSize: 11, color: "#64748b", marginTop: 2, lineHeight: 1.25 }}>{subtitle}</div>}
          </div>
        </div>
        <div style={{ border: `1px solid ${accent}35`, background: `${accent}10`, borderRadius: 10, padding: compact ? "5px 9px" : "6px 10px", fontSize: compact ? 13 : 14, fontWeight: 900, color: accent, whiteSpace: "nowrap" }}>
          {scoreValue(totals.total)}<span style={{ fontSize: 11, color: "#94a3b8" }}> /{totalMax}</span>
        </div>
      </div>

      <div style={{ border: "1px solid #dbe3ef", borderRadius: 10, overflow: "hidden", boxShadow: "0 8px 18px rgba(15,23,42,0.03)", display: horizontalParts ? "grid" : "block", gridTemplateColumns: horizontalParts ? "repeat(auto-fit, minmax(135px, 1fr))" : undefined }}>
        {parts.map(([key, label]) => {
          const color = PART_COLORS[key];
          const value = totals[key];
          const max = maxScores[key] ?? 0;
          return (
            <div key={key} style={{ padding: rowPadding, borderBottom: horizontalParts ? "none" : "1px solid #edf2f7", borderRight: horizontalParts ? "1px solid #edf2f7" : "none", background: "#fff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, marginBottom: rowMargin }}>
                <span style={{ color: "#475569", fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</span>
                <span style={{ color, fontSize: compact ? 13 : 14, fontWeight: 900, whiteSpace: "nowrap" }}>{scoreValue(value)}<span style={{ fontSize: 10, color: "#94a3b8" }}> /{max}</span></span>
              </div>
              <div style={{ height: barHeight, background: "#eef2f7", borderRadius: 999, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${percent(value, max)}%`, background: color, borderRadius: 999 }} />
              </div>
            </div>
          );
        })}
        <div style={{ padding: rowPadding, background: "#fff" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, marginBottom: rowMargin }}>
            <span style={{ color: "#475569", fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: 0.4 }}>Total</span>
            <span style={{ color: "#059669", fontSize: compact ? 14 : 15, fontWeight: 900, whiteSpace: "nowrap" }}>{scoreValue(totals.total)}<span style={{ fontSize: 10, color: "#94a3b8" }}> /{totalMax}</span></span>
          </div>
          <div style={{ height: barHeight, background: "#eef2f7", borderRadius: 999, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${percent(totals.total, totalMax)}%`, background: "#059669", borderRadius: 999 }} />
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div
      style={{
        background: "#fff",
        border: isFinal ? "1.5px solid #7c3aed" : "1px solid #dbe3ef",
        borderLeft: `4px solid ${isFinal ? "#7c3aed" : accent}`,
        borderRadius: 12,
        padding: compact ? 10 : 12,
        display: "flex",
        flexDirection: "column",
        gap: compact ? 8 : 10,
        boxShadow: isFinal ? "0 14px 34px rgba(124,58,237,0.12)" : "0 10px 26px rgba(15,23,42,0.06)",
        minHeight: 0,
        ...cardStyle,
      }}
    >
      {sideContent ? (
        <div className="score-card-side-layout" style={{ display: "grid", gridTemplateColumns: "minmax(320px, 0.9fr) minmax(320px, 1.1fr)", gap: compact ? 10 : 12, alignItems: "start", minHeight: 0 }}>
          <div style={{ display: "grid", gap: compact ? 8 : 10, alignContent: "start" }}>
            {marksPanel}
            {extraContent}
          </div>
          {sideContent}
        </div>
      ) : (
        <>
          {marksPanel}
          {extraContent && <div className="score-card-extra-slot">{extraContent}</div>}
        </>
      )}

      {hasRemarks && (
        <div className="score-card-remarks-slot" style={{ background: isFinal ? "#fff" : "#f8fafc", border: isFinal ? "1px solid #e9d5ff" : "1px solid #e2e8f0", borderRadius: 10, padding: compact ? "8px 10px" : "9px 11px" }}>
          <div style={{ fontSize: 11, fontWeight: 850, color: isFinal ? "#5b21b6" : "#475569", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 5 }}>{remarksTitle || `${title} Remarks`}</div>
          <div className="score-card-remarks-content">{remarksContent}</div>
        </div>
      )}
    </div>
  );
}

export function CompactSummaryCard({ title, subtitle, totals, maxScores, accent = "#312e81", remarksTitle, remarksContent }) {
  const rows = [
    ["Part A", totals.partA, maxScores.partA, "#6366f1"],
    ["Part B", totals.partB, maxScores.partB, "#0ea5e9"],
    ...(maxScores.partC !== undefined ? [["Part C", totals.partC, maxScores.partC, "#0f766e"]] : []),
    ...(maxScores.partD !== undefined ? [["Part D", totals.partD, maxScores.partD, "#f59e0b"]] : []),
    ["Total", totals.total, maxScores.grand, "#059669"],
  ];
  const hasRemarks = Boolean(remarksContent);

  return (
    <div style={{ background: "rgba(255,255,255,0.96)", border: "1px solid #e7eaf3", borderRadius: 16, padding: 14, display: "grid", gridTemplateColumns: hasRemarks ? "minmax(300px, 0.95fr) minmax(280px, 1.05fr)" : "1fr", gap: 12, alignItems: "stretch", boxShadow: "0 16px 38px rgba(15,23,42,0.07)" }}>
      <div style={{ display: "grid", gap: 9, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 900, color: "#0f172a" }}>{title}</div>
            <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{subtitle}</div>
          </div>
          <div style={{ background: `${accent}14`, color: accent, border: `1px solid ${accent}33`, borderRadius: 12, padding: "7px 12px", fontSize: 13, fontWeight: 900, whiteSpace: "nowrap", boxShadow: "0 8px 18px rgba(15,23,42,0.05)" }}>
            {(parseFloat(totals.total) || 0).toFixed(1)} / {maxScores.grand}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${rows.length}, minmax(0, 1fr))`, gap: 8 }}>
          {rows.map(([label, value, max, color]) => (
            <div key={label} style={{ background: "linear-gradient(180deg,#ffffff 0%,#f8fafc 100%)", border: "1px solid #eef2f7", borderRadius: 10, padding: "9px 10px", minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 6, alignItems: "baseline", marginBottom: 5 }}>
                <span style={{ fontSize: 10, color: "#64748b", fontWeight: 800, textTransform: "uppercase" }}>{label}</span>
                <span style={{ fontSize: 11, color, fontWeight: 900, whiteSpace: "nowrap" }}>{(parseFloat(value) || 0).toFixed(1)} / {max}</span>
              </div>
              <ScoreBar score={value} max={max} color={color} />
            </div>
          ))}
        </div>
      </div>
      {hasRemarks && (
        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: "11px 12px", minWidth: 0 }}>
          <div style={{ fontWeight: 900, color: accent, fontSize: 12, marginBottom: 5 }}>{remarksTitle}</div>
          {remarksContent}
        </div>
      )}
    </div>
  );
}

export function StatusBadge({ status = "Pending Review" }) {
  const map = {
    Submitted: { bg: "#dbeafe", color: "#1e40af", dot: "#3b82f6" },
    "Pending Review": { bg: "#fef3c7", color: "#92400e", dot: "#f59e0b" },
    "Pending HOD Review": { bg: "#fef3c7", color: "#92400e", dot: "#f59e0b" },
    "Pending Director Review": { bg: "#fef3c7", color: "#92400e", dot: "#f59e0b" },
    "Pending Dean Review": { bg: "#fef3c7", color: "#92400e", dot: "#f59e0b" },
    "Pending VC Review": { bg: "#fef3c7", color: "#92400e", dot: "#f59e0b" },
    Reviewed: { bg: "#d1fae5", color: "#065f46", dot: "#10b981" },
    "HOD Reviewed": { bg: "#dbeafe", color: "#1e40af", dot: "#3b82f6" },
    "Director Reviewed": { bg: "#d1fae5", color: "#065f46", dot: "#10b981" },
    "Director Approved": { bg: "#cffafe", color: "#164e63", dot: "#06b6d4" },
    "Dean Reviewed": { bg: "#ede9fe", color: "#5b21b6", dot: "#7c3aed" },
    "VC Reviewed": { bg: "#d1fae5", color: "#065f46", dot: "#10b981" },
    Rejected: { bg: "#fee2e2", color: "#991b1b", dot: "#dc2626" },
    "HOD Rejected": { bg: "#fee2e2", color: "#991b1b", dot: "#dc2626" },
    "Director Rejected": { bg: "#fee2e2", color: "#991b1b", dot: "#dc2626" },
    "Dean Rejected": { bg: "#fee2e2", color: "#991b1b", dot: "#dc2626" },
    "VC Rejected": { bg: "#fee2e2", color: "#991b1b", dot: "#dc2626" },
  };
  const resolved = status || "Pending Review";
  const s = map[resolved] || map["Pending Review"];

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: s.bg, color: s.color, fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, display: "inline-block" }} />
      {resolved}
    </span>
  );
}

export function LogoutConfirmModal({ onCancel, onConfirm, portalName = "the portal", confirmLabel = "Yes, Logout" }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", zIndex: 1000, display: "grid", placeItems: "center" }} onClick={onCancel}>
      <div style={{ width: "min(380px, 92vw)", background: "#fff", borderRadius: 12, padding: "26px 28px", boxShadow: "0 20px 60px rgba(0,0,0,0.25)", fontFamily: "inherit" }} onClick={(event) => event.stopPropagation()}>
        <div style={{ color: "#0f172a", fontWeight: 900, fontSize: 17, marginBottom: 8 }}>Confirm Logout</div>
        <div style={{ color: "#64748b", fontSize: 12, lineHeight: 1.6, marginBottom: 18 }}>You are about to leave {portalName}. Any unsaved edits will be lost.</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" onClick={onCancel} style={{ flex: 1, border: "none", borderRadius: 8, background: "#f1f5f9", color: "#475569", padding: "10px", fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
          <button type="button" onClick={onConfirm} style={{ flex: 1, border: "none", borderRadius: 8, background: "#dc2626", color: "#fff", padding: "10px", fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
