import PreviousYearReportActions from "./PreviousYearReportActions";
import { SectionCard as SC } from "../../faculty-appraisal/components";

export default function PreviousYearReportShell({ report, title, reviews = [] }) {
  if (!report?.academicYear) {
    return <EmptyNotice title="Select an academic year">Choose an academic year from the header to view its previous-year appraisal report.</EmptyNotice>;
  }

  const hasReport = report.partA.sections.some((section) => section.rows.length || section.attachments.length) ||
    report.partB.sections.some((section) => section.rows.length || section.attachments.length) ||
    (report.totals?.faculty?.grand || 0) > 0;

  if (!hasReport) {
    return (
      <EmptyNotice title="No previous-year report available" academicYear={report.academicYear}>
        We could not find a submitted previous-year appraisal report for this academic year. Please contact appraisal@dypiu.ac.in.
      </EmptyNotice>
    );
  }

  return (
    <SC title={`${title} - ${report.academicYear}`} accent="#4c1d95">
      <PreviousYearReportActions report={report} title={title} reviews={reviews} />
    </SC>
  );
}

function EmptyNotice({ title, academicYear, children }) {
  return (
    <SC title="Previous Year Appraisal Report" accent="#4c1d95">
      <div style={{ border: "1px solid #dbe3ef", background: "linear-gradient(180deg,#ffffff 0%,#f8fbff 100%)", color: "#334155", borderRadius: 12, padding: "18px 20px", lineHeight: 1.5, boxShadow: "0 10px 24px rgba(15,23,42,0.04)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <span style={{ width: 38, height: 38, borderRadius: 12, background: "#f5f3ff", color: "#4c1d95", border: "1px solid #ddd6fe", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <NoticeIcon />
          </span>
          <div>
            <div style={{ color: "#111827", fontSize: 16, fontWeight: 950 }}>{title}</div>
            {academicYear && <div style={{ marginTop: 6, color: "#4c1d95", fontSize: 12, fontWeight: 900 }}>Academic Year: {academicYear}</div>}
            <div style={{ marginTop: 8, color: "#64748b", fontSize: 13, fontWeight: 700 }}>{children}</div>
          </div>
        </div>
      </div>
    </SC>
  );
}

function NoticeIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v5h5" />
      <path d="M9 14h6" />
      <path d="M9 18h3" />
    </svg>
  );
}
