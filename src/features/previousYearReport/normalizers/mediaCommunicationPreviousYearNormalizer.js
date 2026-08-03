import { normalizePreviousYearReport } from "./commonPreviousYearNormalizer";
import {
  MEDIA_COMMUNICATION_PREVIOUS_YEAR_GRAND_MAX,
  MEDIA_COMMUNICATION_PREVIOUS_YEAR_PART_A_MAX,
  MEDIA_COMMUNICATION_PREVIOUS_YEAR_PART_A_SECTIONS,
  MEDIA_COMMUNICATION_PREVIOUS_YEAR_PART_B_MAX,
  MEDIA_COMMUNICATION_PREVIOUS_YEAR_PART_B_SECTIONS,
} from "../constants/previousYearMediaCommunicationSections";

export const normalizeMediaCommunicationPreviousYearReport = (input = {}) =>
  normalizePreviousYearReport({
    ...input,
    formType: "mediaCommunication",
    partASections: MEDIA_COMMUNICATION_PREVIOUS_YEAR_PART_A_SECTIONS,
    partBSections: MEDIA_COMMUNICATION_PREVIOUS_YEAR_PART_B_SECTIONS,
    partAMax: MEDIA_COMMUNICATION_PREVIOUS_YEAR_PART_A_MAX,
    partBMax: MEDIA_COMMUNICATION_PREVIOUS_YEAR_PART_B_MAX,
    grandMax: MEDIA_COMMUNICATION_PREVIOUS_YEAR_GRAND_MAX,
  });
