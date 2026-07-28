# Faculty Appraisal 2.0 Integration Verification

This document summarizes the current frontend wiring between the React app and the Faculty Appraisal 2.0 backend, with special focus on Part C, Part D, reviewer workflow payloads, and dynamic maximum marks.

## Main Flow

1. Faculty logs in and is routed to the correct dashboard/form by role and school.
2. Faculty fills the appraisal form and can save section drafts.
3. Faculty submits the appraisal through `submitAppraisal`.
4. Backend creates the workflow status, next reviewer, and review chain.
5. Reviewer dashboards load pending records through `/dashboard/subordinates`.
6. Reviewers open the submitted form, save review drafts, then approve or reject.
7. Final reviewer/VC approval locks the appraisal and completes the workflow.

## Key Frontend Files

- `src/services/appraisalPersistence.js`
  - Saves faculty drafts and submits self-appraisal payloads.
  - Normalizes totals into both camelCase and snake_case fields.
- `src/services/reviewWorkflow.js`
  - Loads reviewer queues from `/dashboard/subordinates`.
  - Saves reviewer drafts.
  - Submits reviewer decisions and scores.
- `src/utils/reviewSummaryTotals.js`
  - Normalizes self and reviewer score summaries.
  - Reads Part C/D scores and dynamic max marks from backend responses.
- `src/features/faculty-appraisal/forms/standard/StandardMyAppraisal.jsx`
  - Standard faculty self-appraisal form.
- `src/features/faculty-appraisal/forms/CreativeSchool/CreativeSchoolAppraisalForm.jsx`
  - Shared MediaComm and DesignArts appraisal/review form.
- `src/pages/MediaCommDashboard.jsx`
  - School of Media & Communication Studies dashboard.
- `src/pages/DesignArtsDashboard.jsx`
  - School of Design & Applied Arts dashboard.
- `src/pages/HODDashboard.jsx`, `src/pages/DirectorDashboard.jsx`, `src/pages/DeanDashboard.jsx`, `src/pages/NonEngineeringDeanDashboard.jsx`, `src/pages/VCDashboard.jsx`
  - Standard reviewer workflow dashboards.

## Self-Appraisal Submission Payload

Faculty self-appraisal submission uses `submitAppraisal` in `src/services/appraisalPersistence.js`.

The totals payload now includes:

```js
partATotal
partBTotal
partCTotal
partDTotal
grandTotal
effectivePartAMax
effectivePartBMax
effectivePartCMax
effectivePartDMax
effectiveGrandMax
```

It also sends snake_case aliases for backend compatibility:

```js
part_a_total
part_b_total
part_c_total
part_d_total
grand_total
effective_part_a_max
effective_part_b_max
effective_part_c_max
effective_part_d_max
effective_grand_max
```

## Reviewer Submission Payload

Reviewer submission uses `submitWorkflowReview` in `src/services/reviewWorkflow.js`.

The review payload now includes:

```js
academic_year
remarks
part_a_score
part_b_score
part_c_score
part_d_score
total_score
section_scores
```

This is wired in:

- HOD dashboard
- Director dashboard
- Dean dashboard
- Non-Engineering Dean dashboard
- VC dashboard
- MediaComm dashboard
- DesignArts dashboard
- Creative-school shared review panel

## Reviewer Draft Payload

Reviewer draft save uses `saveReviewerDraft` in `src/services/reviewWorkflow.js`.

The central draft service supports:

```js
part_a_score
part_b_score
part_c_score
part_d_score
total_score
remarks
section_scores
```

MediaComm and DesignArts review panels pass Part C and Part D into reviewer drafts. The older standard reviewer panels currently save only their calculated A/B/total values into the draft call.

## Dynamic Max Marks

Backend dynamic max fields from `/dashboard/subordinates` are normalized in `src/services/reviewWorkflow.js` and `src/utils/reviewSummaryTotals.js`.

Supported self-appraisal max fields:

```js
faculty_part_a_max
faculty_part_b_max
faculty_part_c_max
faculty_part_d_max
faculty_total_max
```

Supported reviewer max fields:

```js
hod_part_a_max
hod_part_b_max
hod_part_c_max
hod_part_d_max
hod_total_max
center_head_part_a_max
center_head_part_b_max
center_head_part_c_max
center_head_part_d_max
center_head_total_max
director_part_a_max
director_part_b_max
director_part_c_max
director_part_d_max
director_total_max
dean_part_a_max
dean_part_b_max
dean_part_c_max
dean_part_d_max
dean_total_max
vc_part_a_max
vc_part_b_max
vc_part_c_max
vc_part_d_max
vc_total_max
```

## Part C Verification

### Standard Appraisal

Status: partially connected.

Connected:

- Standard self-appraisal has Part C state and UI.
- Part C total is calculated as `partCTotal`.
- `partCTotal` is included in faculty draft and final submit totals.
- `part_c_total` is included through the normalized totals payload.
- Summary/report display includes Part C.
- Queue normalization reads `part_c_total`, `faculty_part_c`, and reviewer Part C fields.
- Reviewer submit calls include `partCScore`.

Important remaining gap:

- The older standard reviewer panels still calculate reviewer totals using the older Part A/Part B grouping. Some administrative/ACR rows are still included in Part A calculations there, and they do not yet compute a standalone standard reviewer `partC` score from the newly added Standard Part C tables.

### MediaComm and DesignArts

Status: connected.

Connected:

- Shared creative-school form defines Part C sections.
- Part C is rendered in the self form and review form.
- Part C is included in `calculateCreativeSchoolTotals`.
- Part C is included in validation for full submission and Part C section submission.
- MediaComm and DesignArts save drafts include `partCTotal` and `effectivePartCMax`.
- MediaComm and DesignArts final submits include `partCTotal` and `effectivePartCMax`.
- Creative-school reviewer draft saves include `partCScore`.
- Creative-school reviewer submit calls include `partCScore`.
- Dashboard submit handlers forward `partCScore` to `submitWorkflowReview`.

## Part D Verification

### Standard Appraisal

Status: partially connected.

Connected:

- Standard self-appraisal has a Part D UI section.
- Standard self-appraisal sends `partDTotal` and `effectivePartDMax`.
- `part_d_total` is included through the normalized totals payload.
- Queue normalization reads `part_d_total`, `faculty_part_d`, and reviewer Part D fields.
- Reviewer submit calls include `partDScore`.

Important remaining gap:

- Standard faculty self-score for Part D is intentionally `0` because Part D is evaluator/ACR-oriented.
- The older standard reviewer panels still do not calculate a standalone reviewer `partD` total for the new 2.0 backend field. They submit `partDScore` only if their local score object contains it.

### MediaComm and DesignArts

Status: connected.

Connected:

- Shared creative-school form defines Part D/ACR sections.
- Part D is rendered in review mode.
- Part D is included in reviewer totals through `calculateCreativeSchoolTotals`.
- MediaComm and DesignArts save and submit totals include `partDTotal` and `effectivePartDMax`.
- Creative-school reviewer draft saves include `partDScore`.
- Creative-school reviewer submit calls include `partDScore`.
- Dashboard submit handlers forward `partDScore` to `submitWorkflowReview`.

## Academic Year Cycles

MediaComm and DesignArts dashboards already tolerate the backend response shape from:

```http
GET /api/v1/academic-years/available
```

The expected backend response is:

```js
["2026-2027", "2025-2026"]
```

The frontend normalizes string cycles into selectable academic year objects and falls back to `2026-2027` if loading fails.

## Direct-to-Registrar Workflow

No frontend bypass logic is required for non-teaching staff who report directly to the registrar. The frontend submits normally; the backend owns the route and workflow status.

## Current Verification Summary

| Area | Status | Notes |
| --- | --- | --- |
| Faculty submit payload Part C/D | Connected | Standard, MediaComm, and DesignArts send totals. |
| Reviewer submit payload Part C/D | Connected at service boundary | All reviewer submit calls pass Part C/D fields; standard panels may pass undefined until their local formulas are upgraded. |
| Reviewer draft Part C/D | Connected for creative schools | Standard reviewer draft calls still save only A/B/total. |
| Dynamic max marks | Connected | Queue normalization and summary helpers read backend max fields. |
| MediaComm Part C/D | Connected | Self, validation, draft, submit, review, and summary paths are wired. |
| DesignArts Part C/D | Connected | Self, validation, draft, submit, review, and summary paths are wired. |
| Standard Part C/D | Partially connected | Self payload is connected; reviewer scoring formulas still need a dedicated Part C/D upgrade. |

## Recommended Next Step

To make Standard appraisal fully 2.0-complete, update the standard HOD, Director, Dean, and VC reviewer panels so their score calculators produce:

```js
{ partA, partB, partC, partD, total }
```

Then ensure their reviewer draft save calls also pass:

```js
partCScore
partDScore
```

