import { useState } from "react";
import PreviousYearScoreSummary from "./PreviousYearScoreSummary";
import { openPreviousYearReport } from "../report/openPreviousYearReport";
import { downloadPreviousYearAttachmentsZip, previousYearAttachmentFiles } from "../utils/previousYearAttachmentDownload";

export default function PreviousYearReportActions({ report, title, showSummary = true, reviews = [] }) {
  const [downloading, setDownloading] = useState(false);
  const attachments = previousYearAttachmentFiles(report);

  const handleDownloadAttachments = async () => {
    if (!attachments.length) {
      alert("No attachments found for this academic year.");
      return;
    }
    setDownloading(true);
    try {
      await downloadPreviousYearAttachmentsZip(report);
    } catch (error) {
      console.error("Could not download previous-year attachments:", error);
      alert(error.message || "Could not download attachments. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: 18 }}>
      {showSummary && <PreviousYearScoreSummary report={report} compact />}
      <div style={actionPanel}>
        <div style={{ minWidth: 0, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={statusIcon}>
            <DocumentIcon />
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: "#111827", fontSize: 16, fontWeight: 900, lineHeight: 1.2 }}>Previous year records are ready</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 7 }}>
              <span style={pill("#eef2ff", "#4338ca", "#c7d2fe")}>Old two-part format</span>
              <span style={pill("#ecfdf5", "#047857", "#bbf7d0")}>{attachments.length} unique attachments</span>
              <span style={pill("#f8fafc", "#475569", "#e2e8f0")}>{report.academicYear}</span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <button type="button" onClick={() => openPreviousYearReport({ report, title, reviews })} style={primaryButton}>
            <ReportIcon />
            Generate Report
          </button>
          <button type="button" onClick={handleDownloadAttachments} disabled={downloading || !attachments.length} style={secondaryButton(downloading || !attachments.length)}>
            <DownloadIcon />
            {downloading ? "Preparing Zip..." : `Download Attachments (${attachments.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}

const actionPanel = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 18,
  alignItems: "center",
  border: "1px solid #dbe3ef",
  borderRadius: 12,
  background: "linear-gradient(180deg,#ffffff 0%,#f7fbff 100%)",
  padding: "18px 20px",
  boxShadow: "0 14px 32px rgba(15,23,42,0.06)",
};

const baseButton = {
  minHeight: 44,
  padding: "10px 18px",
  borderRadius: 9,
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: 12,
  fontWeight: 900,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  whiteSpace: "nowrap",
};

const primaryButton = {
  ...baseButton,
  border: "none",
  background: "#4c1d95",
  color: "#fff",
  boxShadow: "0 10px 18px rgba(76,29,149,0.18)",
};

const secondaryButton = (disabled) => ({
  ...baseButton,
  border: "1px solid #bbf7d0",
  background: disabled ? "#f1f5f9" : "#ecfdf5",
  color: disabled ? "#94a3b8" : "#047857",
  cursor: disabled ? "not-allowed" : "pointer",
  boxShadow: disabled ? "none" : "0 10px 18px rgba(4,120,87,0.09)",
});

const statusIcon = {
  width: 42,
  height: 42,
  borderRadius: 12,
  background: "#ede9fe",
  color: "#4c1d95",
  border: "1px solid #ddd6fe",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const pill = (background, color, border) => ({
  display: "inline-flex",
  alignItems: "center",
  minHeight: 24,
  borderRadius: 999,
  border: `1px solid ${border}`,
  background,
  color,
  padding: "4px 9px",
  fontSize: 11,
  fontWeight: 900,
});

function DocumentIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v5h5" />
      <path d="M9 13h6" />
      <path d="M9 17h4" />
    </svg>
  );
}

function ReportIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 3H6a2 2 0 0 0-2 2v16h16V5a2 2 0 0 0-2-2h-2" />
      <path d="M8 3h8v4H8z" />
      <path d="M8 12h8" />
      <path d="M8 16h6" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}
