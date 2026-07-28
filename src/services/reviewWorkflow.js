import { api } from "./api";
import { APP_INFO } from "../constants/formConfig";
import {
  canAuthorityReviewProfile,
  getSchoolKey,
  getReviewChain,
  isRejectedStatus,
  pendingStatusFor,
  rejectedStatusFor,
  profileFromsessionStorage,
  reviewedStatusFor,
  roleLabel,
  normalizeRoleForWorkflow,
} from "../utils/hierarchy";
import { standardReviewSummary, standardSubmittedScoreSummary } from "../utils/reviewSummaryTotals";

const n = (value) => parseFloat(value) || 0;
const clean = (value) => String(value ?? "").trim();
const lower = (value) => clean(value).toLowerCase();
const normalizeStatusText = (value) =>
  lower(value)
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

const firstValue = (...values) =>
  values.find((value) => clean(value) !== "") ?? "";

const numberValue = (...values) => n(firstValue(...values));

const initialsFor = (name, fallback = "U") =>
  String(name || fallback)
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const roleColor = (role) =>
  role === "hod" || role === "center_head" ? "#f59e0b"
  : role === "director" ? "#3b82f6"
  : role === "dean" ? "#8b5cf6"
  : "#6366f1";

const getNested = (item, key) =>
  firstValue(
    item?.[key],
    item?.profile?.[key],
    item?.payload?.info?.[key],
    item?.form?.info?.[key],
    item?.info?.[key],
  );

const subjectProfileFromItem = (item = {}) => {
  const role = normalizeRoleForWorkflow(firstValue(
    item.appraisalRole,
    item.appraisal_role,
    item.role,
    item.profile?.appraisal_role,
    item.profile?.role,
    item.payload?.submittedByRole,
    item.form?.submittedByRole,
    item.info?.appraisalRole,
    item.info?.appraisal_role,
    item.info?.role,
  ));

  return {
    ...item,
    email: firstValue(item.email, item.faculty_email, item.facultyEmail, item.username),
    full_name: firstValue(item.name, item.full_name, item.fullName, item.profile?.full_name),
    appraisal_role: role,
    role,
    school: firstValue(
      item.school,
      item.school_name,
      item.schoolName,
      item.school_code,
      item.schoolCode,
      item.school_id,
      item.schoolId,
      getNested(item, "school"),
    ),
    department: firstValue(
      item.department,
      item.department_name,
      item.departmentName,
      item.department_code,
      item.departmentCode,
      getNested(item, "department"),
    ),
    designation: firstValue(item.designation, getNested(item, "designation")),
    qualification: firstValue(
      item.qualification,
      item.qual,
      item.educational_qualifications,
      item.educationalQualifications,
      item.profile?.qualification,
      item.facultyProfile?.qualification,
      item.faculty_profile?.qualification,
      item.submitterProfile?.qualification,
      item.submitter_profile?.qualification,
      item.payload?.submitterProfile?.qualification,
      item.payload?.submitter_profile?.qualification,
      getNested(item, "qualification"),
      getNested(item, "qual"),
    ),
    teaching_experience: firstValue(
      item.teaching_experience,
      item.teachingExperience,
      item.experience,
      item.profile?.teaching_experience,
      item.profile?.experience,
      item.facultyProfile?.teaching_experience,
      item.facultyProfile?.experience,
      item.faculty_profile?.teaching_experience,
      item.faculty_profile?.experience,
      item.submitterProfile?.teaching_experience,
      item.submitterProfile?.experience,
      item.submitter_profile?.teaching_experience,
      item.submitter_profile?.experience,
      item.payload?.submitterProfile?.teaching_experience,
      item.payload?.submitterProfile?.experience,
      item.payload?.submitter_profile?.teaching_experience,
      item.payload?.submitter_profile?.experience,
      getNested(item, "teaching_experience"),
      getNested(item, "teachingExperience"),
      getNested(item, "experience"),
    ),
  };
};

const getWorkflowStatus = (item = {}) =>
  firstValue(
    item.status,
    item.workflowStatus,
    item.workflow_status,
    item.declarationStatus,
    item.declaration_status,
    item.declaration?.status,
    item.payload?.status,
    item.form?.status,
  );

const hasSubmittedAppraisal = (item = {}) => {
  if (item.hasSubmittedAppraisal === true) return true;
  if (item.hasSubmittedAppraisal === false) return false;

  const status = normalizeStatusText(getWorkflowStatus(item));
  const chain = getReviewChain(subjectProfileFromItem(item));
  const workflowStatuses = new Set([
    "submitted",
    "pending review",
    "reviewed",
    "completed",
    ...chain.flatMap((role) => [
      normalizeStatusText(pendingStatusFor(role)),
      normalizeStatusText(reviewedStatusFor(role)),
    ]),
  ]);

  const hasWorkflowStatus =
    workflowStatuses.has(status) ||
    status.startsWith("pending ") ||
    status.includes(" reviewed") ||
    status.includes(" approved") ||
    status.includes(" rejected");

  const hasDeclaration = Boolean(clean(firstValue(
    item.declaration_id,
    item.declarationId,
    item.declaration?.id,
    item.declaration?.submitted_at,
    item.submitted_at,
    item.submittedAt,
    item.submittedOn,
    item.payload?.submitted_at,
    item.form?.submitted_at,
  )));

  const hasWorkflowPointers = Boolean(clean(firstValue(
    item.next_reviewer,
    item.nextReviewer,
    item.next_reviewer_role,
    item.nextReviewerRole,
  )));

  const hasPriorReview = ["hod", "center_head", "director", "dean", "vc"].some((role) => hasReviewScore(item, role));

  return hasWorkflowStatus || hasDeclaration || hasWorkflowPointers || hasPriorReview;
};

const hasReviewScore = (item = {}, role) => {
  const reviewSummary = standardReviewSummary(item, item.payload, item.form);
  if (role === "hod" || role === "center_head") {
    return n(reviewSummary.hodTotal) > 0 || Boolean(clean(reviewSummary.hodRemarks));
  }

  if (role === "director") {
    return n(reviewSummary.directorTotal) > 0 || Boolean(clean(reviewSummary.directorRemarks));
  }

  if (role === "dean") {
    return n(reviewSummary.deanTotal) > 0 || Boolean(clean(reviewSummary.deanRemarks));
  }

  if (role === "vc") {
    return n(reviewSummary.vcTotal) > 0 || Boolean(clean(reviewSummary.vcRemarks));
  }

  return false;
};

const rejectedRoleFromStatus = (status, chain = []) => {
  const normalizedStatus = normalizeStatusText(status);
  if (!isRejectedStatus(normalizedStatus)) return "";

  return chain.find((role) => {
    const label = normalizeStatusText(roleLabel(role));
    const key = normalizeStatusText(role);
    return normalizedStatus === normalizeStatusText(rejectedStatusFor(role)) ||
      normalizedStatus.includes(`${label} rejected`) ||
      normalizedStatus.includes(`${key} rejected`);
  }) || "";
};

const activeRejectedRoleFor = (item = {}, chain = []) => {
  const hintedRole = normalizeRoleForWorkflow(firstValue(
    item.reviewer_role,
    item.reviewerRole,
    item.current_reviewer,
    item.current_reviewer_role,
    item.currentReviewerRole,
    item.authority_role,
  ));
  const rejectedDecision = [
    item.decision,
    item.review_decision,
    item.reviewDecision,
    item.review_status,
    item.reviewStatus,
  ].some(isRejectedStatus) || item.rejected === true || item.is_rejected === true;

  if (rejectedDecision && chain.includes(hintedRole)) return hintedRole;

  const statusCandidates = [
    getWorkflowStatus(item),
    item.declarationStatus,
    item.declaration_status,
    item.declaration?.status,
    item.review_status,
    item.reviewStatus,
    item.workflowStatus,
    item.workflow_status,
  ];
  const rejectedRole = statusCandidates
    .map((status) => rejectedRoleFromStatus(status, chain))
    .find(Boolean);

  if (rejectedRole) return rejectedRole;
  return statusCandidates.some(isRejectedStatus) || rejectedDecision ? "unknown" : "";
};

const statusStageIndex = (item = {}, chain = []) => {
  const status = normalizeStatusText(getWorkflowStatus(item));
  if (!status) return null;
  const rejectedRole = activeRejectedRoleFor(item, chain);
  if (rejectedRole) {
    const rejectedIndex = chain.indexOf(rejectedRole);
    return rejectedIndex >= 0 ? rejectedIndex : -1;
  }
  if (status === "submitted" || status === "pending review") return 0;
  if (status === "reviewed" || status === "completed") {
    const scoreStages = chain
      .map((role, index) => hasReviewScore(item, role) ? index + 1 : -1)
      .filter((index) => index >= 0);
    return scoreStages.length ? Math.max(...scoreStages) : chain.length;
  }

  for (let index = 0; index < chain.length; index += 1) {
    const role = chain[index];
    const label = normalizeStatusText(roleLabel(role));
    if (status === normalizeStatusText(pendingStatusFor(role)) || status.includes(`pending ${label}`)) {
      return index;
    }
    if (
      status === normalizeStatusText(reviewedStatusFor(role)) ||
      status.includes(`${label} reviewed`) ||
      status.includes(`${label} approved`)
    ) {
      return index + 1;
    }
  }

  return status.includes("approved") ? chain.length : null;
};

const hasReachedReviewer = (item = {}, reviewerRole) => {
  const role = normalizeRoleForWorkflow(reviewerRole);
  const subjectProfile = subjectProfileFromItem(item);
  const chain = getReviewChain(subjectProfile);
  const reviewerIndex = chain.indexOf(role);

  if (reviewerIndex < 0) return false;

  const stageIndex = statusStageIndex(item, chain);
  if (stageIndex !== null) return stageIndex >= reviewerIndex;

  if (reviewerIndex === 0) return true;
  return chain.slice(0, reviewerIndex).every((previousRole) => hasReviewScore(item, previousRole));
};

const isReviewableForRole = (item = {}, reviewerRole, reviewerProfile = {}) => {
  const role = normalizeRoleForWorkflow(reviewerRole);
  const reviewer = { ...reviewerProfile, appraisal_role: role };
  const subjectProfile = subjectProfileFromItem(item);
  const rejectionRole = activeRejectedRoleFor(item, getReviewChain(subjectProfile));

  if (rejectionRole && rejectionRole !== role) return false;
  if (rejectionRole === "unknown") return false;

  return hasSubmittedAppraisal(item) &&
    canAuthorityReviewProfile(reviewer, subjectProfile) &&
    hasReachedReviewer(item, role);
};

const normalizeQueueItem = (item = {}) => {
  const subjectProfile = subjectProfileFromItem(item);
  const appraisalRole = subjectProfile.appraisal_role;
  const submitted = hasSubmittedAppraisal(item);
  const status = getWorkflowStatus(item) || (submitted ? pendingStatusFor(getReviewChain(subjectProfile)[0]) : "");
  const email = subjectProfile.email;
  const academicYear = firstValue(item.academicYear, item.academic_year, item.info?.ay, APP_INFO.DEFAULT_AY, "2026-2027");
  const school = subjectProfile.school;
  const selfSummary = standardSubmittedScoreSummary(item);
  const reviewSummary = standardReviewSummary(item, item.payload, item.form);

  return {
    ...item,
    id: firstValue(item.id, item.declaration_id, item.declarationId, `${email}:${academicYear}`),
    email,
    academicYear,
    academic_year: academicYear,
    name: firstValue(item.name, item.full_name, item.fullName, subjectProfile.full_name, email),
    appraisalRole,
    appraisal_role: appraisalRole,
    school,
    schoolCode: getSchoolKey(school),
    department: subjectProfile.department,
    designation: subjectProfile.designation,
    qualification: subjectProfile.qualification,
    qual: subjectProfile.qualification,
    teaching_experience: subjectProfile.teaching_experience,
    experience: subjectProfile.teaching_experience,
    info: {
      ...(item.info || {}),
      name: firstValue(item.info?.name, item.name, item.full_name, item.fullName, subjectProfile.full_name, email),
      qual: firstValue(item.info?.qual, item.info?.qualification, subjectProfile.qualification),
      desig: firstValue(item.info?.desig, item.info?.designation, subjectProfile.designation),
      school: firstValue(item.info?.school, school),
      experience: firstValue(item.info?.experience, item.info?.teaching_experience, subjectProfile.teaching_experience),
      ay: firstValue(item.info?.ay, academicYear),
    },
    status,
    workflowStatus: status,
    hasSubmittedAppraisal: submitted,
    partATotal: selfSummary.partA,
    partBTotal: selfSummary.partB,
    partCTotal: selfSummary.partC,
    partDTotal: selfSummary.partD,
    grandTotal: selfSummary.total,
    selfPartA: selfSummary.partA,
    selfPartB: selfSummary.partB,
    selfPartC: selfSummary.partC,
    selfPartD: selfSummary.partD,
    selfTotal: selfSummary.total,
    effectivePartAMax: selfSummary.partAMax,
    effectivePartBMax: selfSummary.partBMax,
    effectivePartCMax: selfSummary.partCMax,
    effectivePartDMax: selfSummary.partDMax,
    effectiveGrandMax: selfSummary.grandMax,
    facultyPartAMax: numberValue(firstValue(item.faculty_part_a_max, item.facultyPartAMax, selfSummary.partAMax)),
    facultyPartBMax: numberValue(firstValue(item.faculty_part_b_max, item.facultyPartBMax, selfSummary.partBMax)),
    facultyPartCMax: numberValue(firstValue(item.faculty_part_c_max, item.facultyPartCMax, selfSummary.partCMax)),
    facultyPartDMax: numberValue(firstValue(item.faculty_part_d_max, item.facultyPartDMax, selfSummary.partDMax)),
    facultyTotalMax: numberValue(firstValue(item.faculty_total_max, item.facultyTotalMax, selfSummary.grandMax)),
    hodPartAMax: numberValue(firstValue(item.hod_part_a_max, item.center_head_part_a_max, item.hodPartAMax, item.centerHeadPartAMax)),
    hodPartBMax: numberValue(firstValue(item.hod_part_b_max, item.center_head_part_b_max, item.hodPartBMax, item.centerHeadPartBMax)),
    hodPartCMax: numberValue(firstValue(item.hod_part_c_max, item.center_head_part_c_max, item.hodPartCMax, item.centerHeadPartCMax)),
    hodPartDMax: numberValue(firstValue(item.hod_part_d_max, item.center_head_part_d_max, item.hodPartDMax, item.centerHeadPartDMax)),
    hodTotalMax: numberValue(firstValue(item.hod_total_max, item.center_head_total_max, item.hodTotalMax, item.centerHeadTotalMax)),
    directorPartAMax: numberValue(firstValue(item.director_part_a_max, item.directorPartAMax)),
    directorPartBMax: numberValue(firstValue(item.director_part_b_max, item.directorPartBMax)),
    directorPartCMax: numberValue(firstValue(item.director_part_c_max, item.directorPartCMax)),
    directorPartDMax: numberValue(firstValue(item.director_part_d_max, item.directorPartDMax)),
    directorTotalMax: numberValue(firstValue(item.director_total_max, item.directorTotalMax)),
    deanPartAMax: numberValue(firstValue(item.dean_part_a_max, item.deanPartAMax)),
    deanPartBMax: numberValue(firstValue(item.dean_part_b_max, item.deanPartBMax)),
    deanPartCMax: numberValue(firstValue(item.dean_part_c_max, item.deanPartCMax)),
    deanPartDMax: numberValue(firstValue(item.dean_part_d_max, item.deanPartDMax)),
    deanTotalMax: numberValue(firstValue(item.dean_total_max, item.deanTotalMax)),
    vcPartAMax: numberValue(firstValue(item.vc_part_a_max, item.vcPartAMax)),
    vcPartBMax: numberValue(firstValue(item.vc_part_b_max, item.vcPartBMax)),
    vcPartCMax: numberValue(firstValue(item.vc_part_c_max, item.vcPartCMax)),
    vcPartDMax: numberValue(firstValue(item.vc_part_d_max, item.vcPartDMax)),
    vcTotalMax: numberValue(firstValue(item.vc_total_max, item.vcTotalMax)),
    avatar: initialsFor(firstValue(item.name, item.full_name, email), email),
    avatarColor: roleColor(appraisalRole),
    hodTotal: numberValue(reviewSummary.hodTotal),
    hodPartA: numberValue(reviewSummary.hodPartA),
    hodPartB: numberValue(reviewSummary.hodPartB),
    hodPartC: numberValue(reviewSummary.hodPartC),
    hodPartD: numberValue(reviewSummary.hodPartD),
    hodRemarks: firstValue(reviewSummary.hodRemarks),
    directorTotal: numberValue(reviewSummary.directorTotal),
    directorPartA: numberValue(reviewSummary.directorPartA),
    directorPartB: numberValue(reviewSummary.directorPartB),
    directorPartC: numberValue(reviewSummary.directorPartC),
    directorPartD: numberValue(reviewSummary.directorPartD),
    directorRemarks: firstValue(reviewSummary.directorRemarks),
    deanTotal: numberValue(reviewSummary.deanTotal),
    deanPartA: numberValue(reviewSummary.deanPartA),
    deanPartB: numberValue(reviewSummary.deanPartB),
    deanPartC: numberValue(reviewSummary.deanPartC),
    deanPartD: numberValue(reviewSummary.deanPartD),
    deanRemarks: firstValue(reviewSummary.deanRemarks),
    vcTotal: numberValue(reviewSummary.vcTotal),
    vcPartA: numberValue(reviewSummary.vcPartA),
    vcPartB: numberValue(reviewSummary.vcPartB),
    vcPartC: numberValue(reviewSummary.vcPartC),
    vcPartD: numberValue(reviewSummary.vcPartD),
    vcRemarks: firstValue(reviewSummary.vcRemarks),
  };
};

export const fetchReviewQueueForRole = async ({
  reviewerRole,
  reviewerProfile = profileFromsessionStorage(),
  academicYear,
  schoolValues = [],
} = {}) => {
  const role = normalizeRoleForWorkflow(reviewerRole || reviewerProfile.appraisal_role || reviewerProfile.role);
  if (!role || role === "faculty") return [];

  try {
    const params = {
      academic_year: academicYear || APP_INFO.DEFAULT_AY || "2026-2027",
      reviewer_role: role,
      pending_status: pendingStatusFor(role),
    };
    if (schoolValues?.length) params.schools = schoolValues.join(",");
    if (reviewerProfile?.school) params.reviewer_school = reviewerProfile.school;
    if (reviewerProfile?.department) params.reviewer_department = reviewerProfile.department;

    const items = await api.get("/dashboard/subordinates", { params });
    return (items || [])
      .map(normalizeQueueItem)
      .filter((item) => isReviewableForRole(item, role, reviewerProfile));
  } catch (err) {
    throw new Error(err?.message || "Could not load review queue.", { cause: err });
  }
};

const workflowForwardingFor = (role, subjectProfile = {}) => {
  const chain = getReviewChain(subjectProfile);
  const reviewerIndex = chain.indexOf(role);
  const fallbackNextReviewer = {
    hod: "director",
    center_head: "vc",
    director: "dean",
    dean: "vc",
  }[role] || "";
  const nextReviewer = reviewerIndex >= 0 ? chain[reviewerIndex + 1] : fallbackNextReviewer;
  const status = nextReviewer ? pendingStatusFor(nextReviewer) : reviewedStatusFor(role);

  return {
    status,
    workflow_status: status,
    review_status: reviewedStatusFor(role),
    next_reviewer: nextReviewer,
    next_reviewer_role: nextReviewer,
  };
};

const workflowRejectionFor = (role) => {
  const status = rejectedStatusFor(role);
  return {
    status,
    declaration_status: status,
    workflow_status: status,
    review_status: status,
    next_reviewer: null,
    next_reviewer_role: null,
    nextReviewer: null,
    nextReviewerRole: null,
    next_reviewer_email: null,
    nextReviewerEmail: null,
    decision: "rejected",
    action: "reject",
    review_decision: "rejected",
    is_rejected: true,
    rejected: true,
    should_forward: false,
    forward: false,
    forwarded: false,
    advance_workflow: false,
    advanceWorkflow: false,
    stop_workflow: true,
    stopWorkflow: true,
  };
};

const rejectionRoleHintsFor = (role) => ({
  reviewer_role: role,
  reviewerRole: role,
  current_reviewer: role,
  current_reviewer_role: role,
  currentReviewerRole: role,
  authority_role: role,
  role,
});

const draftRoleFor = (reviewerRole) => {
  const rawRole = lower(reviewerRole).replace(/[\s-]+/g, "_");
  if (rawRole === "section_head") return "section_head";
  return normalizeRoleForWorkflow(rawRole);
};

export const loadReviewerDraft = async ({
  subjectEmail,
  academicYear,
  reviewerRole,
} = {}) => {
  const role = draftRoleFor(reviewerRole);
  if (!subjectEmail || !academicYear || !role || role === "faculty") {
    return { payload: null, updated_at: null };
  }

  return await api.get(`/appraisal-remarks/draft/${encodeURIComponent(subjectEmail)}`, {
    params: {
      academic_year: academicYear,
      reviewer_role: role,
    },
  }) || { payload: null, updated_at: null };
};

export const saveReviewerDraft = async ({
  subjectEmail,
  academicYear,
  reviewerRole,
  partAScore = 0,
  partBScore = 0,
  partCScore = 0,
  partDScore = 0,
  totalScore = 0,
  remarks = "",
  sectionScores,
  payload,
} = {}) => {
  const role = draftRoleFor(reviewerRole);
  if (!subjectEmail || !academicYear || !role || role === "faculty") {
    throw new Error("Missing reviewer draft details.");
  }

  return await api.put(`/appraisal-remarks/draft/${encodeURIComponent(subjectEmail)}`, {
    academic_year: academicYear,
    reviewer_role: role,
    payload: payload || {
      part_a_score: n(partAScore),
      part_b_score: n(partBScore),
      part_c_score: n(partCScore),
      part_d_score: n(partDScore),
      total_score: n(totalScore),
      remarks,
      section_scores: sectionScores || {},
    },
  }) || {};
};

export const submitWorkflowReview = async ({
  subjectEmail,
  academicYear,
  reviewerRole,
  partAScore = 0,
  partBScore = 0,
  partCScore = 0,
  partDScore = 0,
  totalScore = 0,
  remarks = "",
  sectionScores,
  subjectProfile,
  decision = "approved",
}) => {
  const role = normalizeRoleForWorkflow(reviewerRole);

  const endpointMap = {
    hod: "hod",
    center_head: "center-head",
    director: "director",
    dean: "dean",
    vc: "final",
  };

  const endpoint = endpointMap[role];
  if (!endpoint) {
    throw new Error(`Unknown reviewer role: ${role}`);
  }

  const basePayload = {
    academic_year: academicYear,
    remarks,
    part_a_score: n(partAScore),
    part_b_score: n(partBScore),
    part_c_score: n(partCScore),
    part_d_score: n(partDScore),
    total_score: n(totalScore),
    section_scores: sectionScores || {},
  };
  const endpointUrl = `/appraisal-remarks/${endpoint}/${encodeURIComponent(subjectEmail)}`;
  const rejected = decision === "rejected";
  const forwarding = rejected ? workflowRejectionFor(role) : workflowForwardingFor(role, subjectProfile || {});

  if (rejected) {
    const roleHints = rejectionRoleHintsFor(role);
    return await api.put(endpointUrl, {
      ...basePayload,
      ...roleHints,
      ...forwarding,
      rejected_by: role,
      rejectedBy: role,
      rejection_reason: remarks,
      rejectionReason: remarks,
    }) || {};
  }

  if (role === "vc") {
    return await api.put(endpointUrl, basePayload) || {};
  }

  let result;
  try {
    result = await api.put(endpointUrl, { ...basePayload, ...forwarding });
  } catch (err) {
    if (rejected) throw err;
    if (![400, 422].includes(err?.response?.status)) throw err;
    result = await api.put(endpointUrl, basePayload);
  }

  return result || {};
};
