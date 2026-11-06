# Backend prompt — persist Registrar edits to a Dynamic form's Registrar-only table(s)

## Context

The frontend has one fixed screen for "whatever this subject's Registrar-only
content is" — the app calls it the Part D screen/queue regardless of form
type, since historically that's always been Standard's Leave & Attendance.
But for a **Dynamic (admin-built custom-schema) form**, there is no fixed
"Part D." An admin can flag `registrar_part = True` on any section they
create, under any part label they typed in (their own "Part A," "Part C,"
"Part D," or anything else) — the screen just collects whichever sections
across the whole schema carry that flag and shows them together, with
arbitrary admin-defined columns, not the fixed Standard-form Leave &
Attendance shape. **Do not assume Registrar-only content is only ever found
under a section literally labeled "Part C" or "Part D" — it can be any
section, under any part, that the admin flagged `registrar_part = True`.**

The frontend already sends the Registrar's edited rows to the existing
release endpoint, but the backend currently drops them silently because the
request model has no field for it.

**Repo/file:** `src/api/v1/dashboard.py`, endpoint `POST /dashboard/part-d-release/{faculty_email}` (function `release_part_d`).

## What already works (do not change)

`PartDReleaseRequest` already has `leave_management: Optional[list[dict]] = None`,
used only by **Standard-form** submitters. When supplied, `release_part_d`:

1. Loads the faculty's `AppraisalSnapshot` for that academic year.
2. Overwrites `snapshot.payload["form"]["leaveManagement"]` (or the nested
   `snapshot.payload["payload"]["form"]["leaveManagement"]` shape, whichever
   the snapshot is actually using), then calls
   `flag_modified(snapshot, "payload")` so SQLAlchemy persists the JSON mutation.
3. Also stashes a copy on the `AppraisalReview` row for the `"registrar"`
   reviewer role, under `section_scores["registrar_part_d_leave_management"]`.
4. Commits.

`GET /dashboard/faculty/{email}` then returns `snapshot.payload` verbatim as
`payload` in the response, which is exactly what the frontend reads back
(`payload.form.leaveManagement`) — this round-trip already works correctly
and **must keep working exactly as it does today**. Nothing about this
`leave_management` path should be touched, reordered, or refactored.

## What's missing — add a parallel `sections` field for Dynamic forms

Dynamic forms don't have a fixed `leaveManagement` key — each table lives
under its own schema-defined section code (the same `custom_..._s_...` key
every other part of a dynamic form is already stored under, e.g.
`custom_525834cf46a548bc81347043135f4b20_s_mtys6pw9_7fegt`). The Registrar
needs to overwrite whichever of those section codes are flagged
`registrar_part = True` on that form's schema, with whatever rows (or field
values) they edited.

### 1. Request model

Add a new **optional, additive** field to `PartDReleaseRequest` — never
required, never touches the `leave_management` field:

```python
class PartDReleaseRequest(BaseModel):
    registrar_part_d_score: float
    remarks: Optional[str] = None
    leave_management: Optional[list[dict]] = None
    academic_year: Optional[str] = None
    # NEW — Dynamic-form equivalent of leave_management: section_code -> the
    # Registrar's edited rows (list) or field values (dict) for that section.
    # Standard-form submitters never send this; leave_management keeps being
    # the only field they use.
    sections: Optional[Dict[str, Any]] = None
```

(`Dict`/`Any` are already imported at the top of `dashboard.py`.)

### 2. Persist it — mirror the `leave_management` block exactly, generalized

Right after the existing `if body.leave_management is not None:` block (around
line 826 in the current file), add an equivalent block for `sections`. Reuse
the **same nested-payload fallback logic** (don't diverge from it — the
snapshot's payload shape isn't 100% consistent across records, which is
exactly why the `leave_management` block already branches three ways):

```python
if body.sections is not None and not isinstance(body.sections, dict):
    raise HTTPException(status_code=400, detail="sections must be an object when supplied")

if body.sections:
    if snapshot and isinstance(snapshot.payload, dict):
        if "form" in snapshot.payload and isinstance(snapshot.payload["form"], dict):
            target_form = snapshot.payload["form"]
        elif "payload" in snapshot.payload and isinstance(snapshot.payload["payload"], dict) and isinstance(snapshot.payload["payload"].get("form"), dict):
            target_form = snapshot.payload["payload"]["form"]
        else:
            snapshot.payload.setdefault("form", {})
            target_form = snapshot.payload["form"]
        for section_code, value in body.sections.items():
            target_form[section_code] = value
        flag_modified(snapshot, "payload")
```

Also stash it on the `AppraisalReview` row for audit, same way
`registrar_part_d_leave_management` is stashed — add this alongside the
existing `leave_management` stash in **both** the "create new review" and
"update existing review" branches:

```python
# in the "create" branch, alongside the existing leave_management line:
if body.sections:
    section_scores["registrar_edited_sections"] = body.sections

# in the "update" branch, alongside the existing leave_management line:
if body.sections:
    curr_scores["registrar_edited_sections"] = body.sections
    rev.section_scores = curr_scores
    flag_modified(rev, "section_scores")
```

### 3. Scope check (recommended, not strictly required)

Before writing, it's worth validating that every key in `body.sections`
actually belongs to a section flagged `registrar_part = True` on this
subject's form schema (the same `FormSectionDefinition` query the score-cap
validation above already runs, filtered by `form_fam`) — reject with 400
otherwise. This stops a compromised/buggy frontend from using this field to
silently overwrite a non-Registrar part the Registrar was never authorized to
touch. Not blocking for a first pass, but flag it if you want it enforced
from day one rather than added later.

### 4. Nothing else changes

- `GET /dashboard/faculty/{email}` needs **no changes** — it already returns
  `snapshot.payload` (hence `payload.form[section_code]`) verbatim, so once
  the write above lands, the existing read path picks it up automatically.
- The score validation, Declaration update, and response shape at the bottom
  of `release_part_d` are untouched.
- Standard-form submitters are entirely unaffected: they never populate
  `sections`, so `if body.sections:` is always falsy for them and this whole
  new block is a no-op.

## Acceptance check

1. A faculty member on a Dynamic (custom-schema) form submits a Registrar-only
   section somewhere in their schema (it doesn't matter what part label or
   section title the admin gave it) with some rows.
2. The Registrar opens the Part D/Registrar review screen, clicks "Edit Table,"
   changes a cell, clicks "Save & Release Part D to VC."
3. Reloading the Registrar's screen (or any HOD/Director/Dean/VC's read-only
   view of that same section) shows the Registrar's edited value, not the
   faculty's original one.
4. Repeat with a schema that has its Registrar-only flag on a section under a
   *different* part label than the first test (e.g. one admin names it
   "Part C," another "Part D," another something else entirely) and confirm
   the same edit/save/reload flow works regardless of the label.
5. Re-run the existing Standard-form Part D (Leave & Attendance) edit flow
   end to end and confirm it behaves identically to before this change —
   this is the regression check that matters most.
