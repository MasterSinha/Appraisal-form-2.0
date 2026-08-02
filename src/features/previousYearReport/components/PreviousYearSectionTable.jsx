import { previousYearCellValue, previousYearScore } from "../normalizers/commonPreviousYearNormalizer";
import {
  SectionCard as SC,
  T,
  TD,
  TDC,
  TDS,
  TH,
} from "../../faculty-appraisal/components";
import { RO } from "../../faculty-appraisal/shared";

export default function PreviousYearSectionTable({ section }) {
  const rows = section.rows?.length ? section.rows : [];
  const columns = section.fields || [];

  return (
    <SC title={`${section.label} (Max ${section.max})`} accent={section.accent || "#6366f1"}>
      <div style={{ overflowX: "auto" }}>
        <table style={T}>
          <thead>
            <tr>
              <th style={{ ...TH, width: 34 }}>SN</th>
              {columns.map(([label]) => <th key={label} style={TH}>{label}</th>)}
              <th style={TH}>View Docs</th>
              <th style={TH}>Faculty Score</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? rows.map((row, index) => (
              <tr key={index} style={index % 2 ? { background: "#f8fafc" } : {}}>
                <td style={TDC}>{index + 1}</td>
                {columns.map(([label, ...aliases]) => (
                  <td key={label} style={TD}>
                    <RO val={previousYearCellValue(row, aliases)} />
                  </td>
                ))}
                <td style={TD}><ViewDocsButton attachments={attachmentsForRow(section.attachments, index)} /></td>
                <td style={TDS}><RO val={previousYearScore(row, "faculty")} center /></td>
              </tr>
            )) : (
              <tr>
                <td style={{ ...TD, textAlign: "center", color: "#94a3b8", fontWeight: 700 }} colSpan={columns.length + 3}>No records found for this section.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </SC>
  );
}

function attachmentsForRow(attachments = [], index) {
  const rowNo = index + 1;
  const exact = attachments.filter((file) => Number(file.rowNo) === rowNo);
  return exact.length ? exact : attachments.filter((file) => !file.rowNo);
}

function ViewDocsButton({ attachments = [] }) {
  const firstUrl = attachments.find((file) => file.fileUrl)?.fileUrl;
  const content = (
    <span style={{ width: 36, height: 36, borderRadius: "50%", background: "#f5f3ff", color: firstUrl ? "#4f46e5" : "#94a3b8", border: "1px solid #ddd6fe", display: "inline-flex", alignItems: "center", justifyContent: "center", opacity: firstUrl ? 1 : 0.65 }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path d="M14 2v6h6" />
        <path d="M9 13h6M9 17h6" />
      </svg>
    </span>
  );
  if (!firstUrl) return content;
  return <a href={firstUrl} target="_blank" rel="noreferrer" aria-label="View documents">{content}</a>;
}
