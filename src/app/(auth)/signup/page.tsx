// src/app/(auth)/signup/page.tsx — Memo Pivot v2: invite-aware signup page.

import { Suspense } from "react";
import Link from "next/link";

import { InviteCodeChip } from "@/components/auth/InviteCodeChip";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { validateInviteCode, type InviteAudience } from "@/lib/invite-codes";

export const metadata = {
  title: "Sign up — Britestate",
  description: "Create your Britestate account.",
};

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function SignupPage({ searchParams }: Props) {
  const params = await searchParams;
  const inviteParam = params.invite ?? null;

  let inviteStatus: {
    code: string;
    valid: boolean;
    audience?: InviteAudience;
    message?: string;
  } | null = null;

  if (inviteParam) {
    const result = await validateInviteCode(inviteParam);
    if (result) {
      inviteStatus = {
        code: inviteParam,
        valid: true,
        audience: result.audience,
      };
    } else {
      inviteStatus = {
        code: inviteParam,
        valid: false,
        message: "This invite code is invalid, expired or not recognised.",
      };
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-neutral-900">
          Create your account
        </h1>
        <p className="mt-1 font-body text-sm text-neutral-500">
          {inviteStatus?.valid
            ? `Invite code accepted — onboarding you as a ${inviteStatus.audience}.`
            : "Find, buy, rent or sell — all in one place."}
        </p>
      </div>

      {inviteStatus && <InviteCodeChip status={inviteStatus} />}

      <OAuthButtons />

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-neutral-200" />
        <span className="font-body text-xs text-neutral-500">
          or sign up with email
        </span>
        <div className="h-px flex-1 bg-neutral-200" />
      </div>

      <Suspense>
        <RegisterForm />
      </Suspense>

      <p className="text-center font-body text-sm text-neutral-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-brand-accent hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
