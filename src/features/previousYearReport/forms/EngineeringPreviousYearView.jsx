import PreviousYearReportShell from "../components/PreviousYearReportShell";
import { normalizeEngineeringPreviousYearReport } from "../normalizers/engineeringPreviousYearNormalizer";

export default function EngineeringPreviousYearView({ form, docs, response, academicYear, profile, sectionView, onSectionChange, reviews = [], showTables = false, visibleLevels }) {
  const report = normalizeEngineeringPreviousYearReport({ form, docs, response, academicYear, profile });
  return (
    <PreviousYearReportShell
      report={report}
      title="Previous Year Appraisal Report"
      sectionView={sectionView}
      onSectionChange={onSectionChange}
      reviews={reviews}
      showTables={showTables}
      visibleLevels={visibleLevels}
    />
  );
}
