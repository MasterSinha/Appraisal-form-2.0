import PreviousYearReportActions from "./PreviousYearReportActions";
import { SectionCard as SC } from "../../faculty-appraisal/components";

export default function PreviousYearReportShell({ report, title, reviews = [] }) {
  if (!report?.academicYear) {
    return <EmptyNotice>Please select an academic year.</EmptyNotice>;
  }

  const hasReport = report.partA.sections.some((section) => section.rows.length || section.attachments.length) ||
    report.partB.sections.some((section) => section.rows.length || section.attachments.length) ||
    (report.totals?.faculty?.grand || 0) > 0;

  if (!hasReport) {
    return <EmptyNotice>No previous year appraisal form found for this academic year.</EmptyNotice>;
  }

  return (
    <SC title={`${title} - ${report.academicYear}`} accent="#4c1d95">
      <PreviousYearReportActions report={report} title={title} reviews={reviews} />
    </SC>
  );
}

function EmptyNotice({ children }) {
  return (
    <SC title="Previous Year Appraisal Report" accent="#4c1d95">
      <div style={{ border: "1px solid #fecaca", background: "#fef2f2", color: "#991b1b", borderRadius: 12, padding: "18px 20px", fontWeight: 800, lineHeight: 1.5 }}>
        {children}
      </div>
    </SC>
  );
}
