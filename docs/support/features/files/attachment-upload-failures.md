---
title: Attachment / file upload failures
area: files
severity_default: P3
code_paths:
  - src/lib/upload/validate.ts
  - src/lib/upload/process.ts
  - src/lib/upload/compress.ts
  - src/services/messaging/attachment-service.ts
  - src/app/api/attachments/route.ts
tables: []
admin_surfaces:
  - /admin/system-health
tier1_actions: []
alert_rules: []
last_verified_commit: ebb22d7b
---

# Attachment / file upload failures

## Summary
A user can't attach a file (message attachment, listing photo, compliance doc).
The upload is rejected client-side by validation, fails during processing/
compression, or is refused by storage. Usually input-specific (size/type), not a
platform outage.

## Symptoms
- "Upload failed" on a specific file; other files work.
- Large images or non-image types rejected.
- Sentry errors from the upload/attachment paths.

## Customer impact
The user can't complete the action needing the file (send an attachment, list a
property, submit a compliance doc). Localised; P3 unless it blocks a whole flow.

## Severity
P3.

## Detection
- Sentry on `lib/upload/*`, `attachment-service.ts`, `api/attachments/route.ts`.
- Customer report with the file specifics (size, type).

## Diagnosis
1. Rejected by `validate.ts` (size/type limits) — expected behaviour; confirm the
   file actually violates a limit vs a limit set too tight.
2. Failing in `process.ts`/`compress.ts` — a corrupt or unusual image can break
   processing.
3. Refused by storage — a storage/RLS problem, not an upload-code problem
   (→ `storage-rls-denials.md`).

## Remediation
- **Legitimate validation rejection** → tell the customer the actual limit; no code
  change.
- **Over-tight limit / processing bug** → fix `validate.ts`/`process.ts` and deploy;
  add the offending file shape to tests.
- **Storage refusal** → see `storage-rls-denials.md`.
- Never accept unvalidated files to "unblock" someone — validation is a security
  boundary (type/size).

## Verification
The specific file (or a corrected one) uploads and appears where expected, and the
downstream action completes. Confirm validation still rejects genuinely bad input.

## Escalation
Storage-layer denial → `storage-rls-denials.md`. Broad upload outage → infra owner.

## Follow-up
If a real file shape was wrongly rejected, add it to upload tests; document actual
size/type limits so support can answer without guessing.
