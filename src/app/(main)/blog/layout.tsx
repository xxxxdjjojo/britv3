export default function BlogLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="min-h-screen bg-neutral-50">{children}</div>;
}
