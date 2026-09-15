# Backend implementation prompt: Standard appraisal compatibility

Implement a backward-compatible Standard Appraisal save/read alias contract in:
`A:\Frontend DYPIU Final\Appraisal Form 2.0\FA2.0(AKP)\Faculty_appraisal`

## Strict scope

- Standard Appraisal only. Do not change Dynamic, Creative, non-teaching, routing, hierarchy, review authorization, score formulas or approval behavior.
- Put Standard compatibility logic in a dedicated module. Shared endpoints may invoke it only for a verified Standard submission. Do not identify Standard merely by the absence of custom keys or by the logged-in reviewer's school.
- Read repository instructions and inspect current changes first. Preserve unrelated work. Do not edit secrets, run production writes, migrate historical data, resubmit appraisals or deploy without explicit authorization.
- Do not promise that all future errors are eliminated. Report verified behavior and remaining limitations.

## Evidence to inspect and reproduce first

1. `src/api/v1/appraisal.py`: snapshot save/read, submit, `shred_form`, and `field_aliases`.
2. `src/models/part_a.py` and `part_b.py`, response schemas, serializers, CRUD, reviewer reads and historical reads.
3. The same router is mounted at `/api/v1` and `/api/v2`; check both supported contracts.
4. `shred_form` contains multiple keys for one model: events/eventRows, alumni/alumniRows, placements/placementRows. It currently deletes model rows inside each mapping iteration. Reproduce whether a later absent alias deletes rows inserted for the first alias.
5. The row loop can assign multiple aliases to the same model attribute in input order. Reproduce conflicts, especially blank values, zero and false.
6. Fields without SQL columns, such as journal impactFactor/authorPosition and book level, are stored in `custom_fields`. Inspect whether nested custom_fields survives resubmission and is returned consistently. Do not assume flattening is already supported.
7. Distinguish raw snapshots from normalized SQL rows: a missing field, database default, explicit null and deliberate empty string are not automatically equivalent.

Recent frontend report failures also involved obsolete report columns. Those were corrected in Standard's frontend report template; backend aliases alone cannot fix template drift.

## Required implementation

### Versioned, section-specific field contract

- Document canonical field IDs, accepted historical aliases, SQL destinations and extra-field storage per Standard section. Verify each mapping against actual frontend save examples and model definitions.
- IDs must not depend on editable display labels or object-key order. Do not conflate fields simply because labels look similar (e.g. publication type vs publisher, conference role vs organization, filing reference vs date).
- Preserve current request/response compatibility. If adding a contract-version marker, make it additive and optional for old records. Determine form family/year from the actual submission, and use an explicit legacy path for unversioned snapshots.
- Resolve aliases deterministically. Preserve 0, false and explicit empty strings. Never revive a deliberately cleared value from a stale alias. If old conflicting values lack enough provenance, retain them and surface a controlled diagnostic instead of inventing a winner.
- Diagnostics must identify section/field, not log personal answers, document URLs or tokens.

### Safe save/submission

- Resolve section aliases before writing. Each Standard storage model should be processed once per submission, not once per alias name.
- Distinguish omitted sections from explicitly empty sections according to draft/full-submission semantics. Do not silently concatenate competing arrays or assume row positions identify the same record.
- Validate conflicting duplicate section sources before deleting data. Use a transaction: failed normalization/validation must leave the previous submission intact.
- Preserve unknown/custom fields and existing row identities. Merge a supplied custom_fields object deliberately; do not discard it, nest it repeatedly, or allow it to overwrite authenticated identity, academic year, review scores or workflow fields.
- Never trust client-supplied reviewer marks through this compatibility adapter. Maintain existing endpoint authorization.
- Preserve existing numeric/date coercion rules; report incompatible values without silently losing original answers. Do not add SQL columns unless genuinely necessary and explicitly approved.

### Read and historical compatibility

- Own snapshot, submitted read, reviewer read and previous-year read must expose equivalent applicant answers for the same saved submission.
- Preserve raw historical snapshots and their version/year. No automatic backfill, schema reassignment or bulk rewrite.
- Prefer authoritative submitted data for historical reports; never substitute the current school assignment or an unrelated draft.
- Define how clients read custom_fields. Prefer preserving nested data and offering documented canonical display fields where appropriate; never promote arbitrary nested keys into security-sensitive fields.
- Existing empty canonical values must not be overwritten without a documented, version-aware rule. Unrecoverable missing values must be reported honestly.

## Frontend compatibility already added

Standard's loading path now uses `standardReadCompatibility.js` before its existing setters. It restores an allowlist of known display fields from custom_fields only when the current canonical value is null/missing. It preserves explicit blank/0/false and nested extras, and does not promote review scores or authorization metadata. Shared persistence and other form families were not modified for this change.

This is a read-side safeguard, not a replacement for a verified backend contract. Coordinate any future response changes against it. Do not introduce guessed aliases requiring frontend work without documenting them.

## Verification required before claiming completion

Use an isolated test database and synthetic fixtures, not real faculty accounts. Include:

1. Canonical-only, alias-only, mixed, reversed-key-order and conflicting rows.
2. Zero, false, blank, null, absent fields and unknown nested fields.
3. Journal impactFactor/authorPosition; book level; project student count/flags; qualification awarding body/date; conference role/date; startup role/status; date/reference fields.
4. Each duplicate section alias alone, both identical, both conflicting, explicit empty and omitted sections. Assert no repeated delete or duplicate insertion.
5. Draft save → reload → edit/clear → save → submit → own read → reviewer read → historical read. Assert answer and attachment identity, not merely successful HTTP status.
6. Failed submissions roll back and preserve previously saved data.
7. Existing unversioned and previous-year fixtures still read without changes to stored snapshots.
8. Repeated normalization is idempotent and does not mutate input objects.
9. Existing Creative/Dynamic/non-teaching tests remain unchanged and pass as regression checks only. Do not implement fixes for those families in this task.
10. Unauthorized identities/reviewer scores inside custom_fields cannot affect stored protected fields.

Deliver the patch, contract documentation and anonymized before/after request-response examples. List files changed, tests actually run, failures/blockers, deployment steps and whether any migration is required. If integration testing is unavailable, explicitly say so; unit tests alone do not establish production compatibility. Do not deploy automatically.
