import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import {
  evaluateProviderAccess,
  isVouchGateBypassed,
  type ProviderAccessRequirement,
  type ProviderAccessState,
} from "@/services/provider/provider-access-policy";
import { getProviderAccessState } from "@/services/provider/provider-access-state";

type ProviderAccessSuccess = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: User;
  state: ProviderAccessState;
  response?: never;
};

type ProviderAccessFailure = {
  supabase?: never;
  user?: never;
  state?: never;
  response: NextResponse;
};

export async function requireProviderAccess(
  requirement: ProviderAccessRequirement = "business",
): Promise<ProviderAccessSuccess | ProviderAccessFailure> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      response: NextResponse.json(
        { code: "unauthorized", error: "Unauthorized" },
        { status: 401 },
      ),
    };
  }

  let state: ProviderAccessState;
  try {
    state = await getProviderAccessState(supabase, user.id, {
      emailConfirmed: !!user.email_confirmed_at,
      roleHint:
        typeof user.app_metadata.role === "string"
          ? user.app_metadata.role
          : undefined,
    });
  } catch {
    return {
      response: NextResponse.json(
        { code: "provider_access_unavailable" },
        { status: 503 },
      ),
    };
  }

  const decision = evaluateProviderAccess(state, requirement, {
    vouchGateBypass: isVouchGateBypassed(),
  });
  if (!decision.allowed) {
    if (decision.reason === "wrong_role") {
      return {
        response: NextResponse.json(
          { code: "forbidden", reason: decision.reason },
          { status: 403 },
        ),
      };
    }
    return {
      response: NextResponse.json(
        { code: "gate_incomplete", reason: decision.reason },
        { status: 403 },
      ),
    };
  }

  return { supabase, user, state };
}
