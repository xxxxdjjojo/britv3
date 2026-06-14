"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type Props = Readonly<{ targetPath: string }>;

export function ClientRedirect({ targetPath }: Props) {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash;
    router.replace(`${targetPath}${hash}`);
  }, [targetPath, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full" />
    </div>
  );
}
