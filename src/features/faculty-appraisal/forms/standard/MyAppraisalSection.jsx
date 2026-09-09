import StandardMyAppraisal from "./StandardMyAppraisal";
import { FORM_TYPES, formTypeForSchool } from "../../../../constants/formRouting";
import { useSchools } from "../../../../services/schoolsService";
import CreativeMyAppraisalSection from "../CreativeSchool/CreativeMyAppraisalSection";

export default function MyAppraisalSection({
  sectionTab,
  onSectionTabChange,
  defaultDesignation = "",
  defaultAcademicYear,
  titleNameFallback = "Faculty",
  subtitleSeparator = ".",
}) {
  useSchools();
  const school = sessionStorage.getItem("school") || sessionStorage.getItem("schoolName") || "";
  const formType = formTypeForSchool(school);

  if (formType === FORM_TYPES.MEDIA_COMM || formType === FORM_TYPES.DESIGN_ARTS) {
    return (
      <CreativeMyAppraisalSection
        sectionTab={sectionTab}
        onSectionTabChange={onSectionTabChange}
        defaultDesignation={defaultDesignation}
        defaultAcademicYear={defaultAcademicYear}
      />
    );
  }

  return (
    <StandardMyAppraisal
      sectionTab={sectionTab}
      onSectionTabChange={onSectionTabChange}
      defaultDesignation={defaultDesignation}
      defaultAcademicYear={defaultAcademicYear}
      titleNameFallback={titleNameFallback}
      subtitleSeparator={subtitleSeparator}
    />
  );
}
