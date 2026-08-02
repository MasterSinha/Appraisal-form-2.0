import { downloadDocumentFile, openDocumentFile } from "../../faculty-appraisal/components";

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
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <button type="button" onClick={() => openDocumentFile(file)} style={actionButton("#f5f3ff", "#4c1d95", "#ddd6fe")}>Open</button>
              <button type="button" onClick={() => downloadDocumentFile(file)} style={actionButton("#ecfdf5", "#047857", "#bbf7d0")}>Download</button>
            </div>
          ) : (
            <span style={{ color: "#94a3b8", fontSize: 12, fontWeight: 900 }}>Unavailable</span>
          )}
        </div>
      ))}
    </div>
  );
}

const actionButton = (background, color, border) => ({
  border: `1px solid ${border}`,
  borderRadius: 7,
  background,
  color,
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: 11,
  fontWeight: 900,
  minHeight: 30,
  padding: "6px 10px",
});
