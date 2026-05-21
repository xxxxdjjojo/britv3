import { createAdminClient } from "@/lib/supabase/admin";
import { captureException } from "@/lib/observability/capture-exception";

/**
 * Complete the purge for a user after the SQL function has run.
 * Handles operations that cannot be done in SQL:
 * - Delete avatar from Supabase Storage
 * - Delete uploaded documents from Storage
 * - Delete the auth.users row to free the email (BUG-13)
 */
export async function completePurge(userId: string) {
  const admin = createAdminClient();

  // Delete avatar files
  const { data: avatarFiles } = await admin.storage
    .from("avatars")
    .list(userId);

  if (avatarFiles?.length) {
    const paths = avatarFiles.map((f) => `${userId}/${f.name}`);
    await admin.storage.from("avatars").remove(paths);
  }

  // Delete buyer documents
  const { data: docFiles } = await admin.storage
    .from("buyer-documents")
    .list(userId);

  if (docFiles?.length) {
    const paths = docFiles.map((f) => `${userId}/${f.name}`);
    await admin.storage.from("buyer-documents").remove(paths);
  }

  // Delete auth.users row to free the email (BUG-13)
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    captureException(error, {
      module: "gdpr",
      feature: "purge-service",
      operation: "deleteAuthUser",
      extra: { userId },
    });
    throw error;
  }
}
