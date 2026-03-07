/**
 * Pure business logic for compliance reminder processing.
 * Shared between the Supabase Edge Function and unit tests.
 * No Supabase/Deno dependencies -- pure functions only.
 */

export type ReminderType = "30-day" | "7-day" | "expired";

export type DocumentDueForReminder = Readonly<{
  id: string;
  property_id: string;
  user_id: string;
  name: string;
  category: string;
  expiry_date: string;
  next_reminder_date: string;
  reminder_sent: boolean;
}>;

export type ReminderAction = Readonly<{
  documentId: string;
  userId: string;
  propertyId: string;
  documentName: string;
  category: string;
  expiryDate: string;
  reminderType: ReminderType;
  notificationTitle: string;
  notificationMessage: string;
  notificationLink: string;
  nextReminderDate: string | null;
  markReminderSent: boolean;
}>;

/**
 * Calculate reminder type based on days until expiry.
 * - "30-day" if days > 14
 * - "7-day" if days <= 14 and > 0
 * - "expired" if days <= 0
 */
export function calculateReminderType(daysUntilExpiry: number): ReminderType {
  if (daysUntilExpiry <= 0) return "expired";
  if (daysUntilExpiry <= 14) return "7-day";
  return "30-day";
}

/**
 * Calculate the next reminder date after processing.
 * - For 30-day reminder: set to expiry - 7 days (so the 7-day reminder fires later)
 * - For 7-day or expired: null (no more reminders needed)
 */
export function calculateNextReminderDate(
  expiryDate: string,
  reminderType: ReminderType,
): string | null {
  if (reminderType !== "30-day") return null;

  const expiry = new Date(expiryDate);
  expiry.setDate(expiry.getDate() - 7);
  return expiry.toISOString().split("T")[0];
}

/**
 * Build a notification title based on the document and reminder type.
 */
function buildNotificationTitle(
  documentName: string,
  reminderType: ReminderType,
  daysUntilExpiry: number,
): string {
  switch (reminderType) {
    case "expired":
      return `${documentName} has expired`;
    case "7-day":
      return `${documentName} expiring in ${daysUntilExpiry} days`;
    case "30-day":
      return `${documentName} expiring in ${daysUntilExpiry} days`;
  }
}

/**
 * Build a notification message for a compliance reminder.
 */
function buildNotificationMessage(
  category: string,
  documentName: string,
  propertyId: string,
  expiryDate: string,
): string {
  return `Your ${category} document '${documentName}' for property ${propertyId} expires on ${expiryDate}. Please renew it promptly.`;
}

/**
 * Process a single document due for reminder, producing the action to take.
 * Pure function -- no side effects.
 */
export function processDocument(
  doc: DocumentDueForReminder,
  today: Date,
): ReminderAction {
  const expiry = new Date(doc.expiry_date);
  const diffMs = expiry.getTime() - today.getTime();
  const daysUntilExpiry = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const reminderType = calculateReminderType(daysUntilExpiry);
  const nextReminderDate = calculateNextReminderDate(
    doc.expiry_date,
    reminderType,
  );

  return {
    documentId: doc.id,
    userId: doc.user_id,
    propertyId: doc.property_id,
    documentName: doc.name,
    category: doc.category,
    expiryDate: doc.expiry_date,
    reminderType,
    notificationTitle: buildNotificationTitle(
      doc.name,
      reminderType,
      daysUntilExpiry,
    ),
    notificationMessage: buildNotificationMessage(
      doc.category,
      doc.name,
      doc.property_id,
      doc.expiry_date,
    ),
    notificationLink: `/dashboard/landlord/properties/${doc.property_id}/documents`,
    nextReminderDate,
    markReminderSent: reminderType !== "30-day",
  };
}

/**
 * Process all documents due for reminders.
 * Returns actions for each document. Errors in one document do not
 * block processing of others.
 */
export function processAllDocuments(
  documents: DocumentDueForReminder[],
  today: Date,
): { actions: ReminderAction[]; errors: { documentId: string; error: string }[] } {
  const actions: ReminderAction[] = [];
  const errors: { documentId: string; error: string }[] = [];

  for (const doc of documents) {
    try {
      const action = processDocument(doc, today);
      actions.push(action);
    } catch (err) {
      errors.push({
        documentId: doc.id,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return { actions, errors };
}
