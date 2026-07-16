import Link from "next/link";

type Props = Readonly<{ params: Promise<{ token: string }> }>;

export default async function VouchInvitePage({ params }: Props) {
  const { token } = await params;
  const next = `/vouch/${encodeURIComponent(token)}`;

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-3xl flex-col justify-center px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Private invitation</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">You have been invited to vouch</h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">
        Sign in with the invited email address to inspect and respond to this request. The invitation does not reveal private details publicly.
      </p>
      <Link className="mt-8 inline-flex min-h-11 w-fit items-center rounded-lg bg-slate-950 px-5 py-3 font-semibold text-white" href={`/login?next=${encodeURIComponent(next)}`}>
        Continue securely
      </Link>
    </main>
  );
}
