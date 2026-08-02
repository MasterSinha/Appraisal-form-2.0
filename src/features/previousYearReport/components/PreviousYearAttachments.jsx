export default function PreviousYearAttachments({ attachments = [] }) {
  if (!attachments.length) {
    return (
      <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: 8, background: "#f8fafc" }}>
        No attachments available for this section.
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 8 }}>
      {attachments.map((file, index) => (
        <div key={`${file.sectionKey}-${file.fileName}-${index}`} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 12, alignItems: "center", border: "1px solid #e5e7eb", borderRadius: 8, padding: "9px 11px", background: "#fff" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: "#111827", fontSize: 12, fontWeight: 850, overflowWrap: "anywhere" }}>{file.fileName || "Document"}</div>
            <div style={{ color: "#64748b", fontSize: 11, fontWeight: 700, marginTop: 2 }}>
              {file.sectionLabel}{file.rowNo ? ` - Row ${file.rowNo}` : ""}{file.fileType ? ` - ${file.fileType}` : ""}
            </div>
          </div>
          {file.fileUrl ? (
            <a href={file.fileUrl} target="_blank" rel="noreferrer" style={{ color: "#4c1d95", fontSize: 12, fontWeight: 900, textDecoration: "none" }}>Open</a>
          ) : (
            <span style={{ color: "#94a3b8", fontSize: 12, fontWeight: 900 }}>Unavailable</span>
          )}
        </div>
      ))}
    </div>
  );
}
