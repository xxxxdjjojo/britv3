---
title: Storage RLS denials
area: files
severity_default: P3
code_paths:
  - src/app/api/landlord/compliance/upload/route.ts
  - src/app/api/providers/documents/upload/route.ts
  - src/services/messaging/attachment-service.ts
tables:
  - storage.objects
admin_surfaces:
  - /admin/system-health
tier1_actions: []
alert_rules: []
last_verified_commit: ebb22d7b
---

# Storage RLS denials

## Summary
An upload or download is refused by Supabase Storage row-level security — the
bucket policy won't let this user read/write this path. The upload code is fine;
the storage policy (or the path/ownership it checks) is the problem.

## Symptoms
- Upload/download returns a permission/403-style error from storage, not a
  validation error.
- A user can't access a file they should own, or an upload lands but can't be read
  back.
- Errors reference `storage.objects` policies.

## Customer impact
The user can't store or retrieve their document. Localised; P3 unless a whole
role/bucket is affected.

## Severity
P3 (single user/path); higher if an entire bucket policy is broken.

## Detection
- Sentry / server logs showing a storage permission error.
- Reproduce the upload/download as the affected role.

## Diagnosis
1. Which bucket + path, and what does the policy in
   `20260616180001_storage_bucket_policies.sql` require (usually owner-scoped via
   `storage.foldername`)?
2. Is the object stored under the path the policy expects (e.g. keyed by the user's
   id)? A path/ownership mismatch denies a legitimate user.
3. Recent migration touching storage policies? Suspect it first.

## Remediation
- **Path/ownership mismatch** → fix the upload route to write under the
  policy-expected path; migrate existing mis-pathed objects if needed.
- **Genuinely wrong policy** → correct it via a new migration (never hand-edit prod
  storage policies outside the migration flow); keep it least-privilege — do NOT
  widen a bucket to public/authenticated-all to "unblock" one user.
- Verify the fix denies other users' objects (no cross-tenant read).

## Verification
The affected user can upload and read their own file, and a different user is still
denied that file. Confirm with an explicit cross-user probe.

## Escalation
Broken bucket policy affecting a role/bucket → infra + DB owner; treat any
cross-tenant read exposure as a security incident.

## Follow-up
Add an RLS db-test for the bucket policy (PR 12 backfill) so a future migration
can't silently open or break it.
