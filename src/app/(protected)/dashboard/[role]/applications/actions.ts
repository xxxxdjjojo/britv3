"use server";

import { createClient } from "@/lib/supabase/server";
import { createApplication } from "@/services/landlord/tenant-application-service";
import type { CreateApplicationInput } from "@/services/landlord/tenant-application-service";

export type ApplicationActionResult = {
  success: boolean;
  error?: string;
  applicationId?: string;
};

export async function submitApplicationAction(
  input: CreateApplicationInput,
): Promise<ApplicationActionResult> {
  try {
    const supabase = await createClient();

    // Verify auth at action boundary — server actions can bypass middleware
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Authentication required" };
    }

    const application = await createApplication(supabase, input);
    return { success: true, applicationId: application.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to submit application";
    return { success: false, error: message };
  }
}
