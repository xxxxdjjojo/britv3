import Link from "next/link";

// Shown when an authenticated user reaches a /dashboard/developer route but is
// not linked to a developer organisation (membership-gated, not role-gated).
export function DeveloperGate() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <h1 className="font-heading text-2xl font-bold text-neutral-900">
        Developer dashboard
      </h1>
      <p className="mx-auto mt-3 max-w-md text-neutral-600">
        This area is for housebuilders and developers advertising new-build
        schemes on TrueDeed. Your account isn&apos;t linked to a developer
        organisation yet.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link
          href="/developers"
          className="inline-flex h-10 items-center rounded-lg bg-brand-primary px-4 text-sm font-semibold text-white hover:bg-brand-primary-light"
        >
          Learn about listing your scheme
        </Link>
        <Link
          href="/contact"
          className="inline-flex h-10 items-center rounded-lg border border-neutral-300 px-4 text-sm font-semibold text-neutral-700 hover:bg-muted"
        >
          Request access
        </Link>
      </div>
    </div>
  );
}
