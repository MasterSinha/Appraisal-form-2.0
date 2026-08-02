import { normalizePreviousYearReport } from "./commonPreviousYearNormalizer";
import {
  ENGINEERING_PREVIOUS_YEAR_GRAND_MAX,
  ENGINEERING_PREVIOUS_YEAR_PART_A_MAX,
  ENGINEERING_PREVIOUS_YEAR_PART_A_SECTIONS,
  ENGINEERING_PREVIOUS_YEAR_PART_B_MAX,
  ENGINEERING_PREVIOUS_YEAR_PART_B_SECTIONS,
} from "../constants/previousYearEngineeringSections";

export const normalizeEngineeringPreviousYearReport = (input = {}) =>
  normalizePreviousYearReport({
    ...input,
    formType: "engineering",
    partASections: ENGINEERING_PREVIOUS_YEAR_PART_A_SECTIONS,
    partBSections: ENGINEERING_PREVIOUS_YEAR_PART_B_SECTIONS,
    partAMax: ENGINEERING_PREVIOUS_YEAR_PART_A_MAX,
    partBMax: ENGINEERING_PREVIOUS_YEAR_PART_B_MAX,
    grandMax: ENGINEERING_PREVIOUS_YEAR_GRAND_MAX,
  });
