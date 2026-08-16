# New Backend Changes Required — Program-based HOD assignment in Edit Profile

This is a focused addendum to `backend_changes_requied.md` (specifically its Section 1
"Department entity" and Section 6 "Program model"). Read those first — this document assumes
that schema already exists and adds the pieces needed for the newly-built frontend: Faculty and
HOD can now pick/see their Department/Program directly from **Edit Profile**, sourced from
whatever their school's Director has added under "Manage Departments" / "Manage Programs".
Nothing here has been built server-side yet.

---

## 1. The flow this supports, end to end

Every teaching school now works the way SoEMR always has — the frontend used to gate the whole
HOD tier on `school === "SoEMR"`; that gate is removed. For **every** school:

```
Faculty (assigned to Program X)
        │
        ▼
   HOD of Program X            (HOD may be assigned several programs at once - see Section 3)
        │
        ▼
   Director of the school
        │
        ▼
   Dean (Engineering track, or Non-Engineering track)
        │
        ▼
        VC
```

If a school has no Director-added programs yet, or a faculty member's program has no HOD
assigned yet, the chain shortens by skipping straight to Director (already correct per
`backend_changes_requied.md` Section 2's `departmentHasHod` resolution rule — no change needed
there, just confirming it still holds once every school participates, not only SoEMR).

**This applies to the current and future academic cycles only.** The 2025-2026 cycle is a closed
historical record from before this feature existed, where only SoEMR actually had HOD accounts —
its stored review data and the frontend's read-only display of it must not be touched or
reinterpreted by anything in this document.

---

## 2. Profile fields: `department` (Faculty) vs `departments` (HOD)

Two different shapes, by role, on the same underlying user/profile record:

```
User (teaching, non-CISR)
├── role                 ("faculty" | "hod" | "director" | "dean" | ...)
├── school
├── department            (string, nullable)  — set for role = "faculty" only
└── departments            (array of strings, nullable) — set for role = "hod" only
```

- **Faculty**: single `department` (one program/department name, matches an entry from
  `GET /schools/{school_code}/departments`). Faculty picks this themselves via Edit Profile — a
  normal self-service field, same trust level as their phone number or qualification.
- **HOD**: `departments`, a list of one or more program/department names. **An HOD does not pick
  this themselves.** It is set exclusively by their school's Director, via the existing "Transfer
  HOD" flow (`backend_changes_requied.md` Section 2, `POST /role-assignments/transfer`) — one
  call per program being assigned, all pointing `incoming_email` at the same HOD. The frontend's
  Edit Profile page shows an HOD's current `departments` as **read-only** and never submits a
  change to it.

Store both fields (don't repurpose one for the other) — a person's role can change over time
(e.g., Faculty promoted to HOD), and keeping the shapes distinct avoids ambiguity about which one
is authoritative for a given role.

## 3. `GET /auth/me` and `PUT /auth/me` — response/request contract

The frontend's existing profile endpoints (`services/authService.js`):

- `PUT /auth/me` — Edit Profile's save action. **Must be a partial update.** Edit Profile now
  intentionally omits `departments` from every request it sends (HOD's program assignment is
  never editable there) — the backend must leave the user's existing `departments` value
  untouched when the field is absent from the request body, never clear it. This is the same
  partial-update expectation as every other optional field on this endpoint (e.g. `qualification`
  being omitted already doesn't wipe a saved qualification) — flagging it explicitly here because
  getting this one wrong would silently undo a Director's HOD assignment every time that HOD next
  edits their own phone number or photo.
- The response body (both `GET /auth/me` and the result of `PUT /auth/me`) must include the
  user's **current, authoritative** `department` or `departments` value — i.e. reflect actual DB
  state, not just echo whatever the request happened to contain. The frontend's session cache
  (`storeUserSession` in `src/auth/session.js`) trusts this response as ground truth and will
  show stale/wrong data if the response is a pass-through of the request instead of a fresh read.
- For a Faculty's own `PUT /auth/me` where they *do* change `department`: treat it as a normal
  field update, same validation tier as today (accept any non-empty string — validating it
  against the school's actual `Department`/program list, per Section 1, is recommended but not a
  hard blocker for this change specifically).

## 4. Review-chain routing must match against the array, not a single string

This is the one genuine logic change beyond `backend_changes_requied.md` Section 2's existing
resolution rule. Today's rule reads (Section 2):

> Faculty's HOD = the active `RoleAssignment` where `role_type = "HOD"` and
> `scope_id = faculty.department_id`.

That's still correct **once `RoleAssignment` exists** (Section 2 is unbuilt too — see its status
note). Until then, or in addition to it, anywhere the backend resolves "who is this faculty
member's HOD" by comparing profile fields directly (e.g. today's `/dashboard/subordinates` query
for `reviewer_role=hod`), the comparison must become:

```
faculty.department  IN  hod.departments
```

— an array-membership check, not `faculty.department == hod.department` string equality. One HOD
legitimately having several programs in `departments` must not cause them to miss faculty in any
of those programs, and must not cause a faculty match against a program that isn't actually
theirs.

If `RoleAssignment` (Section 2) lands first and becomes the sole source of truth for HOD
resolution, this array-membership concern is naturally subsumed — Section 6 already covers that
"one HOD, several `RoleAssignment` rows" is the expected shape there. This section exists in case
`/dashboard/subordinates`'s current (broken — see `backend_changes_requied.md` Section 2's status
note, it currently 500s) implementation resolves HOD membership by reading `hod.departments`
directly instead of going through `RoleAssignment`; whichever approach is used, array membership
is the required semantics, not single-value equality.

**Frontend status: done.** `canAuthorityReviewProfile`'s HOD branch (`src/utils/hierarchy.js`)
now checks `reviewerProfile.departments` (array, falling back to the single `department` value
for an HOD who's only ever had one assignment) with `.some(...)` membership, scoped inside the
existing `getSchoolKey` same-school check — same-school-only was already enforced there and is
untouched. This is real, working matching logic today, entirely client-side; it's correct for
whatever `departments` the frontend has (from `Edit Profile`'s read-only display / session
storage) regardless of how that array gets populated server-side.

## 5. Manage Programs redesign — create, assign-existing, and remove, all from one control

The Manage Programs/Departments panel (`ManageDepartmentsPanel.jsx`) now shows each program's
currently assigned HOD **directly on the row, always visible** — not hidden behind a toggle a
Director has to click to discover — via a new `HodAssignmentControl` component. From there a
Director can, per program:

- **See who's assigned** right now (or "Unassigned").
- **Create a new HOD** and assign them to this program in one step — this already works today,
  no backend change needed. It reuses the existing `POST /auth/register` endpoint (the same one
  Signup calls) with `role: "hod"`, `department`, and `departments: [thisProgram]` in the payload.
  Verified live end-to-end: a Director created a real HOD account this way, and that account
  logged in with the correct `department`/`departments` already set.
- **Assign an existing HOD** to this program (in addition to whatever programs they already
  have) — picked from a dropdown of that school's existing HOD accounts, or a manual email
  fallback if the list is empty. Uses the existing `POST /role-assignments/transfer` endpoint
  from `backend_changes_requied.md` Section 2 (still unbuilt server-side, so this 404s today,
  same as before — no regression, just now reachable from a clearer UI).
- **Remove** the current HOD from this program, with no replacement required (distinct from
  Transfer, which always needs an incoming person). New endpoint, needs backend support:

  `POST /role-assignments/remove` — body `{role_type, scope_id}`. Closes the active
  `RoleAssignment` for that scope (`status = "transferred"` or a dedicated `"removed"` status,
  `end_date = now()`) without creating a new one — the position becomes vacant. Same auth as
  `POST /role-assignments/transfer` in `backend_changes_requied.md` Section 2 (Director, scoped
  to their own school's programs). Frontend: `removeRoleAssignment()` in
  `src/services/roleAssignmentsService.js`.

- **List existing HODs for a school** (powers the "assign existing HOD" dropdown above). New
  endpoint, needs backend support:

  `GET /schools/{school_code}/hods` — returns every account with `role = "hod"` and
  `school = school_code`: `[{email, full_name, departments}, ...]`. Read-only, no side effects.
  Auth: requester must be an active Director of that school (or VC). Frontend:
  `fetchSchoolHods()` in `src/services/roleAssignmentsService.js` — returns `[]` and falls back
  to manual email entry if this 404s, so the UI degrades gracefully until it's built.

## 6. What's already handled elsewhere — not duplicated here

- Creating/listing/removing Department/Program rows: `backend_changes_requied.md` Section 1.
- SoEMR vs. "everyone else" terminology and the "one HOD, many programs" capability itself:
  `backend_changes_requied.md` Section 6.
- `RoleAssignment` / Transfer HOD mechanics, auth, and the fact that its two endpoints don't exist
  yet (hence today's "Not Found" errors on the Manage Programs panel's HOD transfer control):
  `backend_changes_requied.md` Section 2.

## 7. Explicitly out of scope for this document

- The 2025-2026 (legacy two-part) academic cycle's stored data and its read-only display — no
  change, per Section 1 above.
- Signup-time HOD department/program selection — Signup already lets an HOD pick one department
  at registration (existing, unchanged behavior); this document only concerns the **Edit
  Profile** surface and the routing-match semantics once an HOD ends up with more than one.

---

## 8. Director assigned to multiple schools (new — school-based, not program-based)

**Requirement:** Director assignment is **school**-based, not program-based. One Director may be
assigned **multiple schools** (e.g. School of Engineering + School of Management + School of
Pharmacy) and must see/review faculty and HOD submissions from every assigned school. A Director
must never see a school they weren't explicitly assigned. HOD assignment (Sections 1-4 above)
stays exactly as specified — same school only — Director's multi-school capability is a
completely independent axis and doesn't change how HOD resolves.

### Why this is a bigger change than Sections 1-6

Everywhere else in this document, "one HOD → several programs" was achievable by reusing the
existing single-valued `department`/`departments` field pattern client-side, because an HOD's
`school` was always singular already. **Director's `school` is singular today, everywhere** — the
session, every dashboard (`DirectorDashboard.jsx`, `DesignArtsDashboard.jsx`,
`MediaCommDashboard.jsx`), and `canAuthorityReviewProfile`'s director branch
(`src/utils/hierarchy.js`) all resolve a Director's authority from one `reviewerProfile.school`
string:

```js
if (reviewerRole === "director") {
  return getSchoolKey(reviewerProfile.school) === getSchoolKey(subjectProfile.school) &&
    (subjectRole === "faculty" || subjectRole === "hod");
}
```

Making this multi-school touches session storage, the profile payload, the matching function
above, and every Director-facing dashboard's queue-fetch (each currently passes a single
`schoolValues: [dirSchool]` to `fetchReviewQueueForRole`). This is not done yet — flagging the
concrete shape needed so backend and frontend can build against the same contract, in the same
style as Section 4's array-membership fix.

### Schema (same pattern as HOD's `departments`, applied to Director's `school`)

```
User (role = "director")
└── schools   (array of school_code strings, nullable)  — replaces reliance on the single
                                                            `school` field for this role only.
                                                            Every other role keeps a single school.
```

Populated the same way HOD's `departments` is: **only by the VC**, via the existing Role
Ownership Transfer mechanism (`backend_changes_requied.md` Section 2) —
`POST /role-assignments/transfer` with `role_type = "Director"`, called once per school being
assigned to that Director (`scope_id` = that school's code). Multiple active `RoleAssignment` rows
sharing the same Director `user_id`, one per `scope_id`, is the expected shape — no new table,
identical reasoning to Section 6's "multi-program HOD" model. The existing uniqueness constraint
(`(role_type, scope_id)` where `status = "active"` — **not** `(role_type, user_id)`) already
permits this correctly; no constraint change needed beyond what Section 6 already specifies.

### `GET /auth/me` / `PUT /auth/me` contract (mirrors Section 3)

- Response includes `schools` (array) for `role = "director"`, reflecting current
  `RoleAssignment` state — not editable via `PUT /auth/me` (same reasoning as HOD's `departments`
  in Section 3: assignment is the VC's action via Transfer, not the Director's own profile edit).
- A Director with only ever one assignment should still resolve correctly — `schools` being a
  single-element array is the normal case today and must not require special-casing.

### Routing/authorization change needed (backend query + frontend matching, once `schools` exists)

Backend: any query resolving "which Director should see this faculty/HOD's form" (the
`/dashboard/subordinates` equivalent for `reviewer_role=director`) must check
`faculty.school IN director.schools`, not equality.

Frontend (once the session/profile carries `schools` for directors — not yet built): the
`canAuthorityReviewProfile` director branch above becomes the same array-`.some(...)` shape
already used for HOD in Section 4:

```js
if (reviewerRole === "director") {
  const reviewerSchools = Array.isArray(reviewerProfile.schools) && reviewerProfile.schools.length
    ? reviewerProfile.schools
    : [reviewerProfile.school];
  return reviewerSchools.some((school) => getSchoolKey(school) === getSchoolKey(subjectProfile.school)) &&
    (subjectRole === "faculty" || subjectRole === "hod");
}
```

Each Director-facing dashboard's queue-fetch would similarly need `schoolValues` to be the
Director's full `schools` list instead of the single `dirSchool` it reads today, and any UI that
currently assumes "the Director's school" as one value (page headers, Manage Programs' own school
scoping, etc.) would need either a school switcher or an aggregated multi-school view — a real
UI decision, not just a data-plumbing one.

### Sequencing recommendation

Land Sections 1-6 (program-based HOD, already frontend-complete pending the `RoleAssignment`
endpoints) first — they're a strict subset of this document's scope and don't depend on this
section. Multi-school Director is a separate, larger unit of work: build the `schools` array +
`RoleAssignment` support first on the backend, then the frontend changes above (profile/session
model + dashboard queue-scoping + matching logic + a school-switching UI) can follow as their own
task, using the exact array-membership pattern already proven for HOD in Section 4.

### Status: not started

No part of the multi-school Director capability has been implemented on either side yet. Today,
a Director's authority is still resolved from the single `school` value everywhere in the
frontend, matching the app's current (pre-this-section) behavior exactly — no regression, just
not yet extended.
