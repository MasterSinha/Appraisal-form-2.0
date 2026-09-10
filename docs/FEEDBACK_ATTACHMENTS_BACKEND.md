# Optional Feedback Attachments

The current backend in src/api/v1/feedback.py accepts JSON only and stores text fields.
File delivery is NOT supported until the following backend work is implemented.

## Request Contract

Keep POST /feedback compatible with existing JSON requests for reports without files.
Also accept multipart/form-data with the same name, email, category, subject and message
fields and one optional file field named attachment. The frontend lets the browser
generate the multipart boundary. No attachment is required to submit a report.

## Implementation

- Parse JSON or multipart according to Content-Type and reuse existing text validation.
- Accept one non-empty PNG, JPEG, WebP, PDF, TXT or LOG file, at most 5 MiB.
  Enforce size and content validation on the server as well as the client.
- Store the attachment in private storage using a generated identifier, never a
  client-provided filesystem path. Store its original name, media type, size and
  storage reference with the Feedback record using a migration.
- Return success only after both report and attachment are saved. Clean up uploaded
  files if the database transaction fails. Reject unsupported attachments explicitly.
- Include attachment metadata in admin list/detail responses and provide an
  authenticated admin download endpoint with Content-Disposition: attachment.
- Preserve existing text-only submissions and admin authorization rules.

## Verification

Test JSON without a file, multipart with and without a file, supported screenshots,
PDF/text/log files, empty/oversized/unsupported files, rollback on upload failure,
and authorized/unauthorized attachment downloads. Verify saved attachments remain
available to administrators after refreshing. Do not silently discard attachments.
