import Link from "next/link";

type Props = Readonly<{
  searchParams: Promise<{ ref?: string; invite?: string }>;
}>;

export default async function JoinPage({ searchParams }: Props) {
  const { ref, invite } = await searchParams;
  const query = new URLSearchParams({ role: "provider" });
  if (invite) query.set("invite", invite);
  else if (ref) query.set("ref", ref);

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-3xl flex-col justify-center px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">TrueDeed referrals</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">Join someone you trust</h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">
        Create your provider account, complete the trust gate, and build your reputation on verified work.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link className="inline-flex min-h-11 items-center rounded-lg bg-slate-950 px-5 py-3 font-semibold text-white" href={`/register?${query}`}>
          Create provider account
        </Link>
        <Link className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-5 py-3 font-semibold" href="/login">
          Sign in
        </Link>
      </div>
    </main>
  );
}
