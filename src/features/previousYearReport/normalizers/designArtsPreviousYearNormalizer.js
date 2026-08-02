import { normalizePreviousYearReport } from "./commonPreviousYearNormalizer";
import {
  DESIGN_ARTS_PREVIOUS_YEAR_GRAND_MAX,
  DESIGN_ARTS_PREVIOUS_YEAR_PART_A_MAX,
  DESIGN_ARTS_PREVIOUS_YEAR_PART_A_SECTIONS,
  DESIGN_ARTS_PREVIOUS_YEAR_PART_B_MAX,
  DESIGN_ARTS_PREVIOUS_YEAR_PART_B_SECTIONS,
} from "../constants/previousYearDesignArtsSections";

export const normalizeDesignArtsPreviousYearReport = (input = {}) =>
  normalizePreviousYearReport({
    ...input,
    formType: "designArts",
    partASections: DESIGN_ARTS_PREVIOUS_YEAR_PART_A_SECTIONS,
    partBSections: DESIGN_ARTS_PREVIOUS_YEAR_PART_B_SECTIONS,
    partAMax: DESIGN_ARTS_PREVIOUS_YEAR_PART_A_MAX,
    partBMax: DESIGN_ARTS_PREVIOUS_YEAR_PART_B_MAX,
    grandMax: DESIGN_ARTS_PREVIOUS_YEAR_GRAND_MAX,
  });
