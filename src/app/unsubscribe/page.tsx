import type { Metadata } from "next";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe-token";
import UnsubscribeClient from "./UnsubscribeClient";

export const metadata: Metadata = {
  title: "Unsubscribe | TrueDeed",
};

type PageProps = Readonly<{
  searchParams: Promise<{ token?: string }>;
}>;

export default async function UnsubscribePage({ searchParams }: PageProps) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold mb-2">Invalid Link</h1>
          <p className="text-muted-foreground">
            This unsubscribe link is missing required information.
          </p>
        </div>
      </div>
    );
  }

  const result = verifyUnsubscribeToken(token);

  if (!result.valid) {
    if (result.reason === "expired") {
      return <UnsubscribeClient token={token} status="expired" />;
    }
    return (
      <div className="min-h-dvh flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold mb-2">Invalid Link</h1>
          <p className="text-muted-foreground">
            This unsubscribe link is not valid. Please use the link from your
            email.
          </p>
        </div>
      </div>
    );
  }

  // Token is valid — show confirmation page
  return <UnsubscribeClient token={token} status="pending" />;
}
