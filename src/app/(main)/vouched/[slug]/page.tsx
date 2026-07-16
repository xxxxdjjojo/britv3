import Link from "next/link";

export default function PublicVouchedPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-3xl flex-col justify-center px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">TrueDeed verified</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">Vouched provider profile</h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">
        Public trust details appear here only after the provider completes three peer and three client vouches with explicit attribution consent.
      </p>
      <Link className="mt-8 inline-flex min-h-11 w-fit items-center rounded-lg border border-slate-300 px-5 py-3 font-semibold" href="/services">
        Browse verified professionals
      </Link>
    </main>
  );
}
