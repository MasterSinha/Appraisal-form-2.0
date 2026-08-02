import PreviousYearReportShell from "../components/PreviousYearReportShell";
import { normalizeMediaCommunicationPreviousYearReport } from "../normalizers/mediaCommunicationPreviousYearNormalizer";

export default function MediaCommunicationPreviousYearView({ form, docs, response, academicYear, profile, sectionView, onSectionChange, reviews = [] }) {
  const report = normalizeMediaCommunicationPreviousYearReport({ form, docs, response, academicYear, profile });
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
