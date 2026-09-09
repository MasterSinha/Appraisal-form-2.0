# Preserve Registrar Part D During Faculty Corrections

Implement this targeted backend change in Faculty_appraisal.

## Required behavior

For current standard and both creative teaching forms, after the first submission,
Part D (Leave & Attendance, 25 marks) stays with Registrar when the immediate
reviewer rejects the appraisal. The remaining editable sections return to the
applicant. Part D remains visible but read-only to the applicant. Pending Part D
stays in Registrar's queue; released Part D keeps its score, remarks, status and
release metadata. Resubmission must not reset or overwrite any of those values.

Keep academic year 2025-2026 legacy behavior, non-teaching workflows, CISR,
reviewer ACR/Part E, school routing and rejection permissions unchanged. Verify
form family and academic year using existing configuration; do not match school
codes or assume that every field named part_d_score is Leave & Attendance.

## Inspect and fix

1. In src/api/v1/dashboard.py, get_part_d_queue currently excludes rejected
   declarations. Include rejected submissions eligible for this teaching Part D
   workflow when Part D is pending. Continue filtering by academic year and
   authorization. Do not include never-submitted drafts or unrelated workflows.
   Correct the stale docstring claiming this queue only applies before VC review.

2. In src/api/v1/remarks.py, preserve Part D during rejection. Keep the existing
   immediate-superior restriction and academic review freeze until resubmission.
   Registrar Part D processing must remain independent of that rejection freeze.

3. In src/api/v1/appraisal.py, resubmission currently calls shred_form before
   updating the declaration and replaces part_d_total from client totals.
   Load the persisted first-submission Part D before shredding, then merge that
   authoritative section into the effective form. Preserve all leaveManagement
   rows, fields and associated attachments in normalized storage AND snapshots.
   Preserve Registrar review score, remarks, timestamps and release metadata.
   Keep pending Part D pending and released Part D released. Use the persisted
   Part D total, especially Registrar's total if released, when calculating the
   new grand total. Do not trust a stale client total or derive an approved score
   from the faculty's original self-score. Keep faculty self-score and Registrar
   score distinct according to the existing model.

4. Apply the same protection to every faculty draft/save/section-update endpoint
   that can write this section after submission. Ignore submitted Part D edits
   and merge persisted values, allowing valid corrections to other sections to
   save successfully. Preserve attachment references during document replacement.
   Missing or empty client Part D must never erase the persisted section. If the
   authoritative section is missing, return a clear recoverable error instead of
   silently inventing zeros or accepting replacement values.

5. Registrar release must work for an eligible rejected appraisal and update
   only Part D and its derived totals. It must not clear rejection status or
   advance academic reviews. Preserve existing authorization and validate the
   score using the correct section limits. Faculty and ordinary reviewers must
   not be able to call this endpoint as Registrar.

6. Serialize Registrar release and faculty resubmission using a transaction and
   a shared row lock (or equivalent existing concurrency control). Acquire the
   lock before reading the authoritative values. Either ordering of concurrent
   requests must retain the latest Registrar score and consistent grand total.

7. Verify status/detail/snapshot responses expose consistent Part D values after
   rejection, draft saving, resubmission and Registrar release. Do not delete
   Registrar reviews when clearing stale academic reviewer drafts or reviews.
   Do not add a reopening API in this task. Reopening Part D would require a
   separately authorized workflow; ordinary rejection must never reopen it.

## Required regression tests

- First submission still allows Faculty to fill Part D normally beforehand.
- Pending Part D + HOD rejection: remains in Registrar queue with original data.
- Released Part D + rejection: retains score, remarks and release metadata.
- Correct A/B/C and resubmit: corrections persist; Part D remains unchanged.
- Send changed, missing, empty or zero Part D through draft and submission APIs:
  persisted rows, attachments and Registrar score survive.
- Registrar releases while rejected: release succeeds, rejection stays active.
- Registrar release races with resubmission: neither operation loses data.
- Both creative variants and standard form obey the same policy.
- Dynamic immediate reviewers still follow existing configured review chains.
- Legacy 2025-2026, CISR, non-teaching and ACR/Part E remain unchanged.
- Unauthorized users cannot alter or release protected Part D.

Report changed files, test results and any contract limitations. Do not claim
end-to-end success without exercising submission, rejection and resubmission.
Avoid unrelated refactors, schema changes or data migrations.

## Registrar editing and release to VC (additional requirement)

Extend the existing Registrar permission to correct submitted Leave & Attendance
fields, then save and release Part D. Faculty still cannot change Part D during
rejection correction. This is permission to edit Part D only, not A/B/C or ACR.

Frontend contract implemented:

- GET /api/v1/dashboard/part-d-queue rows must return can_edit_part_d: true only
  when the authenticated Registrar may edit that specific record. The Edit Part D
  button remains hidden without this permission. Preserve this field in responses.
- Return both pending and released records that Registrar may still correct;
  honor the existing pending filter for other callers, and support
  include_reviewed=true for the editing dashboard. Return the latest persisted
  leave_management array, Registrar score, remarks and review/release timestamps.
- POST /api/v1/dashboard/part-d-release/{faculty_email} accepts academic_year,
  registrar_part_d_score, remarks, and optional leave_management (array of rows).
  A request without leave_management retains the existing rows.
- Editable row fields: clTaken, mlTaken, odTaken, coffTaken, clOutOf, mlOutOf,
  odOutOf, coffOutOf, lateRemarks, workingDays, managementRating. Validate numeric
  values as finite and nonnegative and validate rating against existing options.
  Preserve row identity, attachments, unknown stored fields and original faculty
  self-score. Never treat an omitted field as a request to erase it.
- Validate Registrar score in [0, 25]. Reject unauthorized edits server-side
  even if a caller manually sends can_edit_part_d. Block edits after final VC
  approval and in closed cycles/legacy years; return can_edit_part_d=false there.
- Save rows, Registrar score, remarks and release metadata atomically, updating
  normalized storage and snapshots consistently. Record actor, time and previous
  values using the existing audit facility. Preserve attachments.
- Release makes Part D available to VC. It does NOT bypass remaining configured
  HOD/Director/Dean approvals and does NOT clear an active rejection. VC can
  finalize only after both the academic chain and Part D requirements are met.
  Return actual part_d_status and workflow status after saving.
- Existing concurrent-resubmission protection above applies to Registrar edits
  too. Faculty resubmission must preserve the latest Registrar-edited rows.

Test editing pending and released records, score/remarks persistence after reload,
cancel without saving, resubmission races, rejection remaining active after release,
VC eligibility gates, forbidden roles, closed cycles and final VC approval.
Do not advertise can_edit_part_d=true until the write contract is implemented.
