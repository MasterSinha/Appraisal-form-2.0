import PreviousYearScoreSummary from "./PreviousYearScoreSummary";
import PreviousYearSectionTable from "./PreviousYearSectionTable";
import { SectionCard as SC } from "../../faculty-appraisal/components";

export default function PreviousYearReportShell({ report, title, sectionView = "partA", onSectionChange }) {
  if (!report?.academicYear) {
    return <EmptyNotice>Please select an academic year.</EmptyNotice>;
  }

  const hasReport = report.partA.sections.some((section) => section.rows.length || section.attachments.length) ||
    report.partB.sections.some((section) => section.rows.length || section.attachments.length) ||
    (report.totals?.faculty?.grand || 0) > 0;

  if (!hasReport) {
    return <EmptyNotice>No previous year appraisal form found for this academic year.</EmptyNotice>;
  }

  const isPartB = sectionView === "partB";
  const selectedPart = isPartB ? report.partB : report.partA;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <SC title={`${title} - ${report.academicYear}`} accent="#4c1d95">
        <PreviousYearScoreSummary report={report} compact />
      </SC>
      <PartHeading tone={isPartB ? "#ede9fe" : "#dbeafe"}>
        {isPartB ? "PART B - Research & Academic Contributions" : "PART A - Teaching & Academic Activities"}
      </PartHeading>
      {selectedPart.sections.map((section) => <PreviousYearSectionTable key={section.key} section={section} />)}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}>
        {isPartB && (
          <button type="button" onClick={() => onSectionChange?.("partA")} style={navButton("#475569")}>
            Previous: Part A
          </button>
        )}
        {!isPartB && (
          <button type="button" onClick={() => onSectionChange?.("partB")} style={navButton("#4c1d95")}>
            Next: Part B
          </button>
        )}
      </div>
    </div>
  );
}

const navButton = (background) => ({
  minHeight: 38,
  padding: "9px 18px",
  borderRadius: 8,
  border: "none",
  background,
  color: "#fff",
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: 12,
  fontWeight: 900,
});

function PartHeading({ children, tone = "#dbeafe" }) {
  return (
    <div style={{ fontWeight: 800, fontSize: 13, color: "#1e293b", background: tone, padding: "8px 14px", borderRadius: 6, letterSpacing: 0.3 }}>
      {children}
    </div>
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
