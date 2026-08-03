import PreviousYearReportActions from "./PreviousYearReportActions";
import PreviousYearScoreSummary from "./PreviousYearScoreSummary";
import PreviousYearSectionTable from "./PreviousYearSectionTable";
import { SectionCard as SC } from "../../faculty-appraisal/components";

export default function PreviousYearReportShell({ report, title, reviews = [], showTables = false, visibleLevels }) {
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
      {showTables ? (
        <PreviousYearTableView report={report} visibleLevels={visibleLevels} />
      ) : (
        <PreviousYearReportActions report={report} title={title} reviews={reviews} />
      )}
    </SC>
  );
}

function PreviousYearTableView({ report, visibleLevels }) {
  const levels = visibleLevels?.length ? visibleLevels : (report.reviewLevels || ["faculty", "hod", "director", "dean"]);
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <PreviousYearFacultyInfo report={report} />
      <PreviousYearScoreSummary report={report} visibleLevels={levels} variant="table" />
      <PartBand title="Part A - Teaching & Academic Activities" />
      {report.partA.sections.map((section) => (
        <PreviousYearSectionTable key={section.key || section.label} section={section} levels={levels} />
      ))}
      <PartBand title="Part B - Research & Academic Contributions" tone="#ede9fe" />
      {report.partB.sections.map((section) => (
        <PreviousYearSectionTable key={section.key || section.label} section={section} levels={levels} />
      ))}
    </div>
  );
}

function PreviousYearFacultyInfo({ report }) {
  const profile = report.profile || {};
  const infoRows = [
    ["Academic Year", report.academicYear],
    ["Name", profile.name || profile.full_name || profile.fullName],
    ["Qual", profile.qual || profile.qualification],
    ["Desig", profile.desig || profile.designation || profile.present_designation],
    ["School", profile.school || profile.school_name || profile.department],
    ["Experience", profile.exp || profile.experience || profile.teaching_experience],
    ["Email", profile.email || profile.faculty_email],
  ].filter(([, value]) => String(value ?? "").trim() !== "");

  return (
    <div style={{ border: "1px solid #dbe3ef", borderRadius: 8, background: "#fff", overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
        <tbody>
          {infoRows.map(([label, value]) => (
            <tr key={label}>
              <td style={{ width: "32%", border: "1px solid #e5e7eb", background: "#f8fafc", padding: "9px 12px", color: "#172033", fontSize: 13, fontWeight: 900 }}>{label}</td>
              <td style={{ border: "1px solid #e5e7eb", padding: "9px 12px", color: "#334155", fontSize: 13, fontWeight: 650, overflowWrap: "anywhere" }}>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PartBand({ title, tone = "#dbeafe" }) {
  return (
    <div style={{ background: tone, color: "#172033", borderRadius: 6, padding: "9px 12px", fontSize: 13, fontWeight: 950 }}>
      {title}
    </div>
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
