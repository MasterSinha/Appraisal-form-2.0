import { api } from "./api";

const normalizeStatus = (status = {}) => ({
  ...status,
  academic_year: status.academic_year || status.academicYear || "",
  is_open: status.is_open ?? status.isOpen ?? status.open ?? false,
  status: String(status.status || "").toLowerCase(),
  locked_actions: Array.isArray(status.locked_actions) ? status.locked_actions : [],
  allow_resubmission_after_rejection: Boolean(status.allow_resubmission_after_rejection),
});

export const getAppraisalWindowStatus = async ({ academicYear } = {}) => {
  if (!academicYear) {
    throw new Error("Please select an academic year.");
  }
  const data = await api.get("/appraisal/window-status", {
    params: { academic_year: academicYear },
  });
  return normalizeStatus(data || {});
};

export const isAppraisalClosed = (windowStatus) => {
  if (!windowStatus) return true;
  return windowStatus.is_open === false || String(windowStatus.status || "").toLowerCase() === "closed";
};

const hasLockedAction = (windowStatus, action) =>
  Array.isArray(windowStatus?.locked_actions) && windowStatus.locked_actions.includes(action);

export const canSaveDraft = (windowStatus) =>
  !isAppraisalClosed(windowStatus) && !hasLockedAction(windowStatus, "save_draft");

export const canSubmitAppraisal = (windowStatus) =>
  !isAppraisalClosed(windowStatus) && !hasLockedAction(windowStatus, "submit");

export const canModifyAttachment = (windowStatus) =>
  !isAppraisalClosed(windowStatus) &&
  !hasLockedAction(windowStatus, "upload_attachment") &&
  !hasLockedAction(windowStatus, "delete_attachment");

export const canEditSelfAppraisal = (windowStatus, appraisalStatus = {}) => {
  if (!windowStatus) return false;
  const statusText = String(appraisalStatus?.status || appraisalStatus?.declaration?.status || "").toLowerCase();
  const rejected = statusText.includes("reject");
  if (rejected && windowStatus.allow_resubmission_after_rejection) return true;
  return !isAppraisalClosed(windowStatus);
};

export const appraisalWindowMessage = (windowStatus, fallbackAcademicYear = "") => {
  if (windowStatus?.message) return windowStatus.message;
  const academicYear = windowStatus?.academic_year || fallbackAcademicYear;
  return academicYear
    ? `Appraisal submission for Academic Year ${academicYear} is closed.`
    : "We could not confirm whether the appraisal window is open. Editing is paused until this is verified.";
};

export const appraisalWindowErrorMessage = (error) => {
  const rawMessage = error?.response?.data?.user_message || error?.message || "";
  if (error?.response?.status === 404 || String(rawMessage).toLowerCase() === "not found") {
    return "We could not confirm whether the appraisal window is open. Editing is paused until this is verified. Please contact support.";
  }
  return rawMessage || "We could not confirm whether the appraisal window is open. Editing is paused until this is verified.";
};
