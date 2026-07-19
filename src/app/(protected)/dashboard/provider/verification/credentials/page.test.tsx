import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { createClient } = vi.hoisted(() => ({ createClient: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({ createClient }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/components/dashboard/provider/CredentialUploadCard", () => ({
  CredentialUploadCard: ({
    label,
    existingDoc,
  }: {
    label: string;
    existingDoc?: { file_name: string; status: string };
  }) => (
    <div>
      {label}: {existingDoc?.file_name ?? "Not uploaded"} {existingDoc?.status ?? ""}
    </div>
  ),
}));

import CredentialsPage from "./page";

describe("CredentialsPage", () => {
  it("renders existing credentials from canonical provider document fields", async () => {
    let selectedColumns = "";
    let ownerColumn = "";
    const query: Record<string, unknown> = {};
    query.select = vi.fn((columns: string) => {
      selectedColumns = columns;
      return query;
    });
    query.eq = vi.fn((column: string) => {
      ownerColumn = column;
      return query;
    });
    query.then = (resolve: (value: unknown) => unknown) =>
      Promise.resolve(
        selectedColumns === "document_type, verification_status, file_name" &&
          ownerColumn === "user_id"
          ? {
              data: [
                {
                  document_type: "identity_proof",
                  verification_status: "approved",
                  file_name: "identity.pdf",
                },
              ],
              error: null,
            }
          : { data: null, error: { message: "provider_documents column does not exist" } },
      ).then(resolve);

    createClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "provider-uuid-1" } },
          error: null,
        }),
      },
      from: vi.fn(() => query),
    });

    render(await CredentialsPage());

    expect(screen.getByText(/identity\.pdf approved/i)).toBeInTheDocument();
  });
});
