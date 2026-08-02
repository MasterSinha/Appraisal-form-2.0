import PreviousYearReportShell from "../components/PreviousYearReportShell";
import { normalizeDesignArtsPreviousYearReport } from "../normalizers/designArtsPreviousYearNormalizer";

export default function DesignArtsPreviousYearView({ form, docs, response, academicYear, profile, sectionView, onSectionChange, reviews = [] }) {
  const report = normalizeDesignArtsPreviousYearReport({ form, docs, response, academicYear, profile });
  return (
    <PreviousYearReportShell
      report={report}
      title="Previous Year Appraisal Report"
      sectionView={sectionView}
      onSectionChange={onSectionChange}
      reviews={reviews}
    />
  );
}
