# Backend Changes Required

This document lists every backend change needed to support the updated appraisal flow
described in `flow and transparency.txt`. The frontend changes that depend on these are
already implemented (see the PR/commit that introduced this file); this is the contract the
backend needs to fulfil for that frontend code to work end to end. Nothing here has been
built server-side yet — treat every endpoint/field below as new.

---

## 1. Department entity (new)

**Why:** HOD-per-department routing now applies to every school, not just SoEMR. Department
names are Director-managed per school instead of a hardcoded list, so they need to be a real,
persisted entity the frontend can list/create/delete.

### Schema

```
Department
├── id
├── school_code       (matches the existing school code enum: SoCSEA, SoBB, SoCE, SoEMR,
│                       SoCM, SoMCS, SoHSS, SoD, SoAA - CISR excluded, it has no departments)
├── name
├── status             ("active" | "inactive")
├── created_by         (user_id of the Director who added it)
└── created_at
```

### Endpoints

- `GET /schools/{school_code}/departments` — list active departments for a school. Used by
  Signup (any unauthenticated/authenticating user selecting a school) and by the Director's
  "Manage Departments" panel. Should return `[{id, name, school_code}]`.
- `POST /schools/{school_code}/departments` — create a department. Auth: requester must be an
  active Director whose own `school_code` matches the path param. Body: `{name}`.
- `DELETE /schools/{school_code}/departments/{department_id}` — remove/deactivate a
  department. Same auth as POST. Recommend **soft delete** (`status = "inactive"`) rather than
  a hard delete, since faculty/HOD accounts may already reference the department by name — a
  hard delete would silently change their routing. Deactivating leaves existing accounts
  functioning (they keep routing via whatever the department resolves to) while hiding it from
  new signups.

### Migration / seed data

SoEMR already has 4 hardcoded departments in the current frontend (`Mechanical Engineering`,
`Civil Engineering`, `Chemical Engineering`, `Semiconductor Engineering`). Seed these as
pre-existing `active` Department rows for `school_code = "SoEMR"` on migration, so existing
SoEMR HOD/Faculty accounts keep routing correctly without the Director having to re-enter them.
No other school needs seed data — their department lists start empty until each school's
Director adds their own.

### Interaction with Role Ownership Transfer (Section 2 below)

Once this table exists, `RoleAssignment.scope_id` for `role_type = "HOD"` should reference
`Department.id` (not a free-text department string), so a department rename doesn't orphan an
active HOD assignment.

---

## 2. Role Ownership Transfer (HOD, Director, Dean)

**Why:** an authority-role holder can be replaced by a newly appointed person mid-cycle. The
outgoing person's ownership of that role transfers to the incoming person and the outgoing
person reverts to Faculty. The source spec described this as backend/data-model only with no
UI implied — but a frontend UI for triggering transfers has since been added (see "Endpoints"
below), so this is now a real API contract the frontend is already calling, not a future
placeholder.

### Core principle

A role is an assignable **position**, not a static field on a user account. Department,
School, and Dean-type records should not store a direct `hod_id` / `director_id` / `dean_id`
foreign key to a user — routing always resolves through the **currently active**
`RoleAssignment` row for that scope.

### Schema

```
RoleAssignment
├── assignment_id
├── role_type         ("HOD" | "Director" | "Dean")
├── scope_type         ("department" | "school" | "dean_type")
├── scope_id            (Department.id for HOD; school_code for Director; "engineering" /
│                        "non_engineering" for Dean — these are the frontend's literal
│                        DEAN_TRACKS values, see src/constants/universityHierarchy.js)
├── user_id             (the person currently holding this position)
├── status              ("active" | "transferred")
├── start_date
└── end_date            (null while active)
```

Resolution rules:
- Faculty's HOD = the active `RoleAssignment` where `role_type = "HOD"` and
  `scope_id = faculty.department_id`.
- Department's Director = the active `RoleAssignment` where `role_type = "Director"` and
  `scope_id = department.school_id`.
- School's Dean = the active `RoleAssignment` where `role_type = "Dean"` and
  `scope_id = school.dean_type`.

### Endpoints (frontend UI already built against this contract)

The frontend now has a real UI for this — tiered by who's authorized to trigger each transfer:
**VC transfers Director/Dean** (`RoleTransferPanel.jsx`, a "Role Transfers" section on the VC
dashboard), **Director transfers HOD** (`RoleTransferForm.jsx`, inline per-department on the
Director's "Manage Departments" panel — a Director can only transfer HODs within their own
school's departments). Both call the same two endpoints via `roleAssignmentsService.js`:

- `GET /role-assignments/active?role_type=...&scope_id=...` — returns **every** account
  currently holding that position, as an array: `[{assignment_id, role_type, scope_id,
  user_id, email, full_name, start_date}, ...]` (empty array if vacant). This endpoint does not
  exist yet — until it's built, the frontend's "Current Director/Dean/HOD" display correctly
  shows "Vacant" everywhere, since there's nothing to fetch (the `GET` fails and the frontend
  falls back gracefully rather than erroring). This is expected today, not a frontend bug.
  **Deliberately returns a list, not a single object**: the one-active-holder-per-scope rule
  below is meant to be enforced by the unique constraint on `RoleAssignment`, but pre-migration
  (see the migration note below) nothing stops two existing accounts from both carrying
  `role=director` for the same school, and the UI needs to surface that rather than silently
  picking one and hiding the discrepancy. Post-migration this should normally return 0 or 1 rows.
  No side effects, read-only.
- `POST /role-assignments/transfer` — body `{role_type, scope_id, incoming_email}`. The
  frontend deliberately does **not** send an outgoing `user_id` — the backend resolves the
  outgoing holder itself from the currently active `RoleAssignment` for that scope (if any; a
  vacant position just gets its first assignment, which is a normal appointment rather than a
  "transfer" in the historical sense, but uses the same endpoint and produces the same
  resulting state). If more than one `RoleAssignment` is somehow active for the scope (should
  only be possible pre-migration/pre-constraint), reject the transfer with a clear error rather
  than guessing which one to close — that needs manual admin cleanup first, not a silent pick.
  Auth:
  - `role_type = "HOD"`: requester must be an active Director whose own `school_code` matches
    the school that owns `scope_id`'s department.
  - `role_type = "Director"` or `"Dean"`: requester must be the active VC.
  - Validate `incoming_email` resolves to an existing account before proceeding.

### Migration: seeding RoleAssignment from existing accounts

Director/Dean/HOD roles already exist as plain fields on user accounts today (`role`, `school`,
`department` — set at Signup, before this feature existed). On cutover, backfill `RoleAssignment`
by scanning existing accounts for each role type and creating one `active` row per
`(role_type, scope_id)` found:

- If a scope has exactly one matching account, that's unambiguous — seed it directly.
- If a scope has **more than one** matching account (legitimately possible today, since Signup
  never enforced one-director-per-school), do **not** auto-pick one as active. Leave that scope
  with no active `RoleAssignment` (i.e. it will show as "Vacant" in the transfer UI until an
  admin manually resolves it via `POST /role-assignments/transfer`, which is safe to use even
  for a first appointment) and log/flag the conflicting accounts for manual review — auto-closing
  one arbitrarily could silently strip a legitimately-active reviewer's permissions.

### Transfer procedure (what the endpoint above does server-side)

1. Close the outgoing person's `RoleAssignment` row: `status = "transferred"`,
   `end_date = now()`.
2. Create a new `RoleAssignment` row for the incoming person: same `role_type`/`scope_id`,
   `status = "active"`, `start_date = now()`.
3. Revert the outgoing person's account role to **Faculty** — this only removes their
   approval/write permission for that position going forward. Their own future appraisal forms
   route through whichever HOD/Director/Dean currently holds authority over them (their
   `department_id`/`school_id` on their own account is preserved so this resolves correctly).
4. Any faculty/department previously routed to the outgoing person automatically routes to the
   incoming person, because routing always resolves via the active `RoleAssignment`.

### Rules that must hold regardless of implementation details

- **Only one active `RoleAssignment` per scope at a time** — enforce with a unique constraint
  on `(role_type, scope_id)` where `status = "active"`.
- **Historical integrity is untouched.** A transfer never rewrites who reviewed a past form —
  it only changes who reviews future ones.
- **Snapshot the reviewer at submission time** (see `FormReviewStage` below) — this is what
  protects historical records from a later transfer.
- **In-progress forms move with the position, not the person.** Any form in `pending` /
  `in_review` status at a scope, where the current stage's reviewer resolves to the outgoing
  person's `RoleAssignment`, is automatically re-resolved to the incoming person's new
  `RoleAssignment` as soon as it goes active — no manual reassignment step, since routing
  already resolves via the active `RoleAssignment` rather than a static user reference. This
  applies only to forms **not yet scored** at that stage — anything already scored and
  submitted keeps the outgoing person's name as reviewer of record.

### `FormReviewStage` — snapshot fields (required for the history guarantee below)

```
FormReviewStage
├── form_id
├── stage_role         ("HOD" | "Director" | "Dean" | "Registrar" | "VC" | ... )
├── reviewer_user_id    (snapshot - who actually acted, permanent, never rewritten)
├── academic_year
├── score / status
└── acted_at
```

Every appraisal form's stage record must independently store the acting `reviewer_user_id` and
`academic_year` at the time it was scored, resolved from the active `RoleAssignment` at the
moment the form reached that stage. Do not derive "who reviewed this" by re-resolving
`RoleAssignment` at read time — after a transfer, the outgoing person's `RoleAssignment` row is
`status = "transferred"`, so that would silently lose their history.

### Read-only history lookup (demoted person's own record access)

A person demoted out of a role (back to Faculty) must retain **read-only**, indefinite access
to every appraisal form tied to their own identity from any previous academic year — whether
they were the originator (their own self-appraisal that year) or the reviewer (forms they
scored as HOD/Director/Dean that year). What was revoked is write/approval permission only;
read/history access is permanent.

- **Lookup key:** email + academic year. Given an email and academic year, return every
  `FormReviewStage` (and the originator's own declaration, if applicable) where
  `reviewer_user_id` or the declaration's `user_id` matches that email, for that academic year
  — regardless of what role they held then or hold now.
- **Strictly read-only:** the endpoint must reject any write/edit/re-score/comment/resubmit
  attempt against a historical form, even from the person who originally reviewed it.
- Suggested endpoint: `GET /users/{email}/appraisal-history?academic_year=2024-25`.

---

## 3. Part D → Registrar release-gate

**Why:** Part D (Leave & Attendance Management) must now be scored by the Registrar for every
teaching-staff form (Faculty/HOD/Director/Dean/Center Head, any school/CISR) — bypassing
HOD/Director/Dean entirely for scoring — but release of that score to the VC is gated on the
Dean/Center-Head-level approval of Parts A/B/C/E on the same form, unless the originator *is*
the Dean/Center Head (nothing to wait for in that case). Today Part D is rendered read-only
everywhere with a self-declared score; none of this routing/gating exists server-side.

### New fields on the appraisal form/declaration record

```
part_d_status              ("pending_registrar" | "registrar_approved_pending_release" |
                             "released_to_vc")
registrar_part_d_score     (0-25)
registrar_part_d_remarks
registrar_part_d_reviewed_at
```

`part_d_status` starts at `"pending_registrar"` as soon as the originator submits their form
(same moment the A/B/C/E chain starts).

### Endpoints

- `GET /dashboard/part-d-queue?academic_year=...&part_d_status=pending_registrar` — returns
  every teaching-staff form (any school, any originator role) currently awaiting Registrar
  Part D review. Auth: Registrar only. This is a new, separate query from
  `/dashboard/subordinates` (which is scoped to the A/B/C/E chain and must **not** include Part
  D items for HOD/Director/Dean/VC).
- `PUT /appraisal-remarks/registrar-part-d/{email}` — Registrar submits Part D score +
  remarks. Body: `{academic_year, part_d_score, remarks, part_d_status}`. The frontend computes
  and sends a suggested `part_d_status` (`released_to_vc` if the originator is a Dean/Center
  Head, i.e. there's no stage above them to wait for; `registrar_approved_pending_release`
  otherwise) — **the backend must treat this as a hint, not authoritative**, and independently
  verify against the form's own review chain before persisting, since the frontend cannot be
  trusted as the source of truth for authorization-relevant state.

### The gate-flip rule (must be atomic and order-independent)

When the Dean (or Center Head, for CISR) approves Parts A/B/C/E on a form — i.e. whenever
their review-chain stage submission would otherwise be the last one before VC — the backend
must check: is this form's `part_d_status` currently `registrar_approved_pending_release`? If
so, flip it to `released_to_vc` in the same transaction as recording the Dean/Center-Head's
A/B/C/E approval.

This must be correct **regardless of which happens first** — the Registrar may approve Part D
before or after the Dean/Center-Head approves A/B/C/E:
- If Registrar approves first: status sits at `registrar_approved_pending_release` until the
  Dean/Center-Head approval event flips it.
- If Dean/Center-Head approves first: Part D is still `pending_registrar` at that moment, so
  there's nothing to flip yet — when the Registrar later submits their score, they should see
  (and the frontend does check via `partDReleaseGateApplies`) that the gating stage has already
  happened, and should be able to write `released_to_vc` directly at that point rather than
  landing on `registrar_approved_pending_release` and waiting forever for an event that already
  fired. The backend must implement this "has the gate stage already happened" check
  independently — do not rely solely on the frontend's suggested status.

The frontend sends a hint `release_part_d_if_pending: true` on the Dean/Center-Head's A/B/C/E
approval request (`PUT /appraisal-remarks/dean/{email}` or
`PUT /appraisal-remarks/center-head/{email}`) when their submission is the chain's last stage
before VC — use this as a trigger to run the check-and-flip, but the authoritative decision of
"is this the gating stage" should be derived server-side from the form's own review chain, not
solely from the flag.

### Authorization changes

- Registrar's authorization must broaden to include teaching-staff forms, but **only for Part
  D** — Registrar must never be able to read or write Parts A/B/C/E of a teaching-staff form.
  This is a new, narrower permission than Registrar's existing non-teaching-staff authority
  (Reporting Officer / Staff), which is untouched.
- HOD/Director/Dean/Center-Head must be able to **read** Part D and the Registrar's
  status/score/remarks on it (for transparency, per the source spec), but must never be able to
  write to it — Part D never routes to them for scoring, at any point.
- VC must not see Part D's actual score until `part_d_status = "released_to_vc"`. Before that,
  the VC's view should only indicate it's pending (the frontend already handles this: it shows
  a placeholder and blocks access to the Registrar's score field until release — but the
  backend endpoint the VC's queue fetch hits should also just not leak `registrar_part_d_score`
  pre-release, so a client that doesn't respect the gate can't read it via network inspection
  either).

### Grand-total computation

Once Part D is released, the form's `grand_total` (currently composed from Parts A/B/C/D-self/E)
must source Part D from `registrar_part_d_score`, not the faculty's self-declared value. Before
release, decide (product call, not specified by the source doc) whether `grand_total` excludes
Part D entirely or still shows the self-declared value as provisional — the frontend's VC view
does not display or rely on `grand_total` for Part D pre-release, so either is safe from the
frontend's perspective, but pick one and document it since other consumers (reports, exports)
may read `grand_total` directly.

---

## 4. Confirmed untouched

- **Non-Teaching Staff flow** (Staff → Reporting Officer → Registrar → VC): no changes. Keeps
  its existing single-track status model, endpoints, and visibility rules exactly as they are
  today. The new Registrar Part D queue (`/dashboard/part-d-queue`) is a separate endpoint from
  the existing non-teaching Registrar queue and must not merge or interfere with it.
- **CISR / SoHSS routing**: both already resolve correctly through the existing chain logic
  (`Center Head` plays the Dean's role for CISR; SoHSS is a standard Non-Engineering school) —
  no CISR- or SoHSS-specific backend logic is needed beyond what's described above; the Part D
  gate and Department entity both apply to them generically (Center Head is treated the same
  as Dean for the gate; CISR itself has no departments, consistent with the frontend excluding
  CISR from `Department` entirely).

---

## 5. Known frontend gap to be aware of

The "Creative School" appraisal form variant (used by SoMCS, SoHSS, SoD, SoAA — see
`CreativeSchoolAppraisalForm.jsx`) currently computes and displays Part D as an
immediately-available, self-scored total folded into the form's own totals, rather than
through the new Registrar-gated flow. The Registrar's own review queue/scoring endpoints above
are already school/form-type agnostic and will work for these schools once a form is submitted
through them, but that form variant's **reviewer-facing display** of Part D has not yet been
updated to gate on `part_d_status` the way the standard form's dashboards were. This is a
frontend follow-up, not a backend gap — flagging it here so the backend contract above isn't
assumed to be exercised end-to-end for those four schools yet.
